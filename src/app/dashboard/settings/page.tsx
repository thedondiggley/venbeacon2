import { getCurrentVendor } from "@/lib/vendor";
import { createClient } from "@/lib/supabase/server";
import { SettingsForm } from "@/components/settings-form";
import { BillingSection } from "@/components/billing-section";
import { AccountSection } from "@/components/account-section";
import { ReferralSection } from "@/components/referral-section";

export default async function SettingsPage() {
  const vendor = await getCurrentVendor();
  const supabase = await createClient();

  const { count: referralCount } = await supabase
    .from("vendors")
    .select("id", { count: "exact", head: true })
    .eq("referred_by", vendor.id);

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-lg font-medium">Settings</h1>
        <p className="text-sm mt-1" style={{ color: "var(--brand-charcoal-soft)" }}>
          Update your business info, public page, billing, and account.
        </p>
      </div>

      <div className="space-y-10 max-w-lg">
        <SettingsForm vendor={vendor} />

        <div className="border-t pt-8" style={{ borderColor: "var(--brand-line)" }}>
          <ReferralSection
            referralCode={vendor.referral_code}
            referralRewardMonths={vendor.referral_reward_months}
            referralRewardAppliedUntil={vendor.referral_reward_applied_until}
            referralCount={referralCount ?? 0}
          />
        </div>

        <div className="border-t pt-8" style={{ borderColor: "var(--brand-line)" }}>
          <BillingSection
            isPro={vendor.is_pro}
            subscription={vendor.subscription}
            hasStripeCustomer={!!vendor.stripe_customer_id}
          />
        </div>

        <div className="border-t pt-8" style={{ borderColor: "var(--brand-line)" }}>
          <AccountSection />
        </div>
      </div>
    </div>
  );
}
