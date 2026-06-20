import { createServiceClient } from "@/lib/supabase/server";
import { createClient } from "@/lib/supabase/server";

export type SubscriptionTier = "free" | "pro";

export type VendorWithSub = {
  id: string;
  user_id: string;
  slug: string;
  business_name: string;
  is_pro: boolean;
  stripe_customer_id: string | null;
  subscription: {
    id: string;
    plan: string;
    status: string;
    current_period_end: string;
    cancel_at_period_end: boolean;
  } | null;
};

/**
 * Get the current vendor with their subscription status.
 * Uses the authenticated user's session.
 * Returns null if not authenticated or no vendor record.
 */
export async function getVendorWithSubscription(): Promise<VendorWithSub | null> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: vendor } = await supabase
    .from("vendors")
    .select("id, user_id, slug, business_name, is_pro, stripe_customer_id")
    .eq("user_id", user.id)
    .single();

  if (!vendor) return null;

  // Get active subscription if any
  const { data: sub } = await supabase
    .from("subscriptions")
    .select("id, plan, status, current_period_end, cancel_at_period_end")
    .eq("vendor_id", vendor.id)
    .in("status", ["active", "trialing", "past_due", "canceled", "unpaid"])
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  return {
    ...vendor,
    subscription: sub ?? null,
  };
}

/**
 * Check if the current authenticated user has Pro access.
 * This is the authoritative check used at the API layer.
 * Always reads from DB — never trusts the client.
 */
export async function requirePro(): Promise<{
  vendor: VendorWithSub;
  isPro: boolean;
}> {
  const vendor = await getVendorWithSubscription();

  if (!vendor) {
    throw new ApiError(401, "Unauthorized");
  }

  return {
    vendor,
    isPro: vendor.is_pro,
  };
}

/**
 * Enforce Pro access — throws 403 if not Pro.
 * Use this in API route handlers for Pro-only endpoints.
 */
export async function enforcePro(): Promise<VendorWithSub> {
  const { vendor, isPro } = await requirePro();
  if (!isPro) {
    throw new ApiError(403, "Pro subscription required");
  }
  return vendor;
}

/**
 * Check the schedule entry limit for free users.
 * Free plan: max 3 active (future) schedule entries.
 * Pro: unlimited.
 */
export async function checkScheduleLimit(vendorId: string, isPro: boolean): Promise<{
  allowed: boolean;
  count: number;
  limit: number | null;
}> {
  if (isPro) return { allowed: true, count: 0, limit: null };

  const supabase = createServiceClient();
  const { count } = await supabase
    .from("locations")
    .select("id", { count: "exact", head: true })
    .eq("vendor_id", vendorId)
    .gte("end_time", new Date().toISOString());

  const currentCount = count ?? 0;
  return {
    allowed: currentCount < 3,
    count: currentCount,
    limit: 3,
  };
}

/**
 * Sync subscription status from Stripe to database.
 * Called from webhook handler after any subscription event.
 */
export async function syncSubscriptionStatus(
  stripeSubscriptionId: string,
  status: string,
  priceId: string,
  periodStart: Date,
  periodEnd: Date,
  cancelAtPeriodEnd: boolean,
  canceledAt: Date | null,
  trialStart: Date | null,
  trialEnd: Date | null,
  stripeCustomerId: string,
): Promise<void> {
  const supabase = createServiceClient();

  // Find vendor by Stripe customer ID
  const { data: vendor } = await supabase
    .from("vendors")
    .select("id")
    .eq("stripe_customer_id", stripeCustomerId)
    .single();

  if (!vendor) {
    console.error(`No vendor found for Stripe customer ${stripeCustomerId}`);
    return;
  }

  const isPro = ["active", "trialing", "past_due"].includes(status);

  // Determine plan from price ID
  const plan =
    priceId === process.env.STRIPE_PRICE_ANNUAL ? "pro_annual" : "pro_monthly";

  // Upsert subscription record
  await supabase
    .from("subscriptions")
    .upsert(
      {
        vendor_id: vendor.id,
        stripe_subscription_id: stripeSubscriptionId,
        stripe_customer_id: stripeCustomerId,
        stripe_price_id: priceId,
        plan,
        status,
        current_period_start: periodStart.toISOString(),
        current_period_end: periodEnd.toISOString(),
        cancel_at_period_end: cancelAtPeriodEnd,
        canceled_at: canceledAt?.toISOString() ?? null,
        trial_start: trialStart?.toISOString() ?? null,
        trial_end: trialEnd?.toISOString() ?? null,
      },
      { onConflict: "stripe_subscription_id" }
    );

  // Update vendor.is_pro cache
  const { data: vendorBefore } = await supabase
    .from("vendors")
    .select("is_pro, referred_by, referral_reward_applied_until")
    .eq("id", vendor.id)
    .single();

  await supabase
    .from("vendors")
    .update({ is_pro: isPro })
    .eq("id", vendor.id);

  // Reward the referrer the FIRST time this vendor goes Pro (not on every renewal)
  const wasAlreadyPro = vendorBefore?.is_pro ?? false;
  const justBecamePro = isPro && !wasAlreadyPro;

  if (justBecamePro && vendorBefore?.referred_by) {
    await applyReferralReward(vendorBefore.referred_by);
  }
}

// Grants the referrer one free month of Pro by pushing back their
// reward-covered period. If they're not currently Pro themselves,
// this still banks the month for whenever they do subscribe.
async function applyReferralReward(referrerId: string): Promise<void> {
  const supabase = createServiceClient();

  const { data: referrer } = await supabase
    .from("vendors")
    .select("id, contact_email, business_name, referral_reward_months, referral_reward_applied_until, stripe_customer_id")
    .eq("id", referrerId)
    .single();

  if (!referrer) return;

  const newRewardMonths = (referrer.referral_reward_months ?? 0) + 1;

  // Extend their free-coverage window by 30 days from whichever is later:
  // now, or their existing reward-covered-until date (stacks rewards).
  const base = referrer.referral_reward_applied_until && new Date(referrer.referral_reward_applied_until) > new Date()
    ? new Date(referrer.referral_reward_applied_until)
    : new Date();
  const newAppliedUntil = new Date(base.getTime() + 30 * 24 * 60 * 60 * 1000);

  await supabase
    .from("vendors")
    .update({
      referral_reward_months: newRewardMonths,
      referral_reward_applied_until: newAppliedUntil.toISOString(),
    })
    .eq("id", referrerId);

  // Notify the referrer they earned a free month
  if (process.env.RESEND_API_KEY && referrer.contact_email) {
    try {
      const { Resend } = await import("resend");
      const resend = new Resend(process.env.RESEND_API_KEY);
      const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://vendorbeacon.app";

      await resend.emails.send({
        from: process.env.BOOKING_NOTIFICATION_FROM_EMAIL ?? "VendorBeacon <notifications@vendorbeacon.app>",
        to: referrer.contact_email,
        subject: "You earned a free month of Pro! 🎉",
        html: `<!DOCTYPE html><html><head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background:#f0f0ee;font-family:-apple-system,sans-serif;">
<div style="max-width:520px;margin:40px auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,.08)">
  <div style="background:#639922;padding:28px 36px;text-align:center"><div style="font-size:22px;font-weight:800;color:#fff">VendorBeacon</div></div>
  <div style="padding:32px 36px;text-align:center">
    <div style="font-size:36px;margin-bottom:12px">🎉</div>
    <h1 style="font-size:20px;font-weight:700;color:#2C2C2A;margin:0 0 8px">You earned a free month of Pro!</h1>
    <p style="font-size:14px;color:#5F5E5A;margin:0 0 20px;line-height:1.6">
      Someone you referred just upgraded to Pro. Thanks for spreading the word, ${referrer.business_name}! We've added a free month to your account.
    </p>
    <a href="${appUrl}/dashboard/settings" style="display:inline-block;background:#639922;color:#fff;text-decoration:none;padding:12px 24px;border-radius:10px;font-size:14px;font-weight:700">View your account →</a>
  </div>
  <div style="background:#f8f8f6;padding:16px 36px;text-align:center;border-top:1px solid #D3D1C7"><p style="font-size:11px;color:#5F5E5A;margin:0">VendorBeacon · <a href="${appUrl}" style="color:#639922">vendorbeacon.app</a></p></div>
</div></body></html>`,
      });
    } catch (err) {
      console.error("Referral reward email error:", err);
    }
  }
}

// Simple typed API error class
export class ApiError extends Error {
  constructor(public statusCode: number, message: string) {
    super(message);
    this.name = "ApiError";
  }
}

export function handleApiError(error: unknown): Response {
  if (error instanceof ApiError) {
    return Response.json({ error: error.message }, { status: error.statusCode });
  }
  console.error("Unexpected API error:", error);
  return Response.json({ error: "Internal server error" }, { status: 500 });
}
