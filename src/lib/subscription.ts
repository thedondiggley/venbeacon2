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
  await supabase
    .from("vendors")
    .update({ is_pro: isPro })
    .eq("id", vendor.id);
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
