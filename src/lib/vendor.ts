import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export type Vendor = {
  id: string;
  user_id: string;
  slug: string;
  business_name: string;
  description: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  instagram_url: string | null;
  facebook_url: string | null;
  tiktok_url: string | null;
  logo_url: string | null;
  is_pro: boolean;
  stripe_customer_id: string | null;
  owner_name: string | null;
  food_type: string | null;
  service_areas: string | null;
  website_url: string | null;
  power_needs: string | null;
  water_needs: boolean;
  insurance_info: string | null;
  disabled: boolean;
  referral_code: string | null;
  referred_by: string | null;
  referral_reward_months: number;
  referral_reward_applied_until: string | null;
  created_at: string;
  updated_at: string;
};

export type VendorWithPlan = Vendor & {
  subscription: {
    plan: string;
    status: string;
    current_period_end: string;
    cancel_at_period_end: boolean;
  } | null;
};

export async function getCurrentVendor(): Promise<VendorWithPlan> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: vendor, error } = await supabase
    .from("vendors")
    .select("*")
    .eq("user_id", user.id)
    .single();

  if (error || !vendor) redirect("/onboarding");

  if (vendor.disabled) {
    await supabase.auth.signOut();
    redirect("/login?disabled=1");
  }

  // Get active subscription
  const { data: sub } = await supabase
    .from("subscriptions")
    .select("plan, status, current_period_end, cancel_at_period_end")
    .eq("vendor_id", vendor.id)
    .in("status", ["active", "trialing", "past_due", "canceled", "unpaid"])
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  return { ...vendor, subscription: sub ?? null } as VendorWithPlan;
}
