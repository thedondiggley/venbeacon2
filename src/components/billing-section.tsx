"use client";

import { useState } from "react";

type Subscription = {
  plan: string;
  status: string;
  current_period_end: string;
  cancel_at_period_end: boolean;
} | null;

const PLAN_LABELS: Record<string, string> = {
  pro_monthly: "Pro Monthly — $25/month",
  pro_annual: "Pro Annual — $225/year",
};

const STATUS_LABELS: Record<string, string> = {
  active: "Active",
  trialing: "Trial",
  past_due: "Past due",
  canceled: "Canceled",
  unpaid: "Unpaid",
};

export function BillingSection({
  isPro,
  subscription,
  hasStripeCustomer,
}: {
  isPro: boolean;
  subscription: Subscription;
  hasStripeCustomer: boolean;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function openPortal() {
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/stripe/portal", { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      window.location.href = data.url;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setLoading(false);
    }
  }

  return (
    <div>
      <h2 className="text-base font-medium mb-4">Billing & subscription</h2>

      {isPro && subscription ? (
        <div className="space-y-3">
          <div className="rounded-lg border p-4" style={{ borderColor: "var(--brand-line)" }}>
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-medium">{PLAN_LABELS[subscription.plan] ?? subscription.plan}</p>
                <p className="text-xs mt-0.5" style={{ color: "var(--brand-charcoal-soft)" }}>
                  Status: {STATUS_LABELS[subscription.status] ?? subscription.status}
                </p>
                {subscription.cancel_at_period_end ? (
                  <p className="text-xs mt-0.5" style={{ color: "#A32D2D" }}>
                    {new Date(subscription.current_period_end).getFullYear() > 1970
                      ? `Cancels ${new Date(subscription.current_period_end).toLocaleDateString(undefined, { month: "long", day: "numeric", year: "numeric" })}`
                      : "Cancels at end of billing period"}
                  </p>
                ) : (
                  <p className="text-xs mt-0.5" style={{ color: "var(--brand-charcoal-soft)" }}>
                    {new Date(subscription.current_period_end).getFullYear() > 1970
                      ? `Renews ${new Date(subscription.current_period_end).toLocaleDateString(undefined, { month: "long", day: "numeric", year: "numeric" })}`
                      : "Active subscription"}
                  </p>
                )}
              </div>
              <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{ background: "var(--brand-green)", color: "#fff" }}>
                PRO
              </span>
            </div>
          </div>

          {error && <p className="text-sm" style={{ color: "#A32D2D" }}>{error}</p>}

          <button
            onClick={openPortal}
            disabled={loading}
            className="rounded-lg px-4 py-2 text-sm border disabled:opacity-60"
            style={{ borderColor: "var(--brand-line)" }}
          >
            {loading ? "Opening..." : "Manage billing & invoices"}
          </button>

          <p className="text-xs" style={{ color: "var(--brand-charcoal-soft)" }}>
            Update payment method, download invoices, or cancel your subscription from the billing portal.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="rounded-lg border p-4" style={{ borderColor: "var(--brand-line)", background: "#fafaf8" }}>
            <p className="text-sm font-medium mb-1">You're on the Free plan</p>
            <p className="text-sm" style={{ color: "var(--brand-charcoal-soft)" }}>
              Upgrade to Pro to unlock the venue board, booking requests, and unlimited schedule entries.
            </p>
          </div>

          <a
            href="/pricing"
            className="inline-block rounded-lg px-4 py-2 text-sm font-medium text-white"
            style={{ background: "var(--brand-green)" }}
          >
            View pricing & upgrade
          </a>

          {hasStripeCustomer && (
            <>
              {error && <p className="text-sm" style={{ color: "#A32D2D" }}>{error}</p>}
              <button
                onClick={openPortal}
                disabled={loading}
                className="block text-sm underline disabled:opacity-60"
                style={{ color: "var(--brand-charcoal-soft)" }}
              >
                {loading ? "Opening..." : "Manage past billing"}
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
