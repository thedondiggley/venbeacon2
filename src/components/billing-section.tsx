"use client";

import { useState } from "react";
import Link from "next/link";

type Subscription = {
  plan: string;
  status: string;
  current_period_end: string;
  cancel_at_period_end: boolean;
} | null;

const PLAN_LABELS: Record<string, string> = {
  pro_monthly: "Pro Monthly — $14.99/month",
  pro_annual: "Pro Annual — $99/year",
};

const STATUS_LABELS: Record<string, string> = {
  active: "Active",
  trialing: "Trial",
  past_due: "Past due",
  canceled: "Canceled",
  unpaid: "Unpaid",
};

export function BillingSection({ isPro, subscription, hasStripeCustomer }: {
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
      if (data.url) window.location.href = data.url;
      else throw new Error(data.error ?? "Failed to open billing portal");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setLoading(false);
    }
  }

  if (!isPro) {
    return (
      <div>
        <h2 className="text-base font-medium mb-1">Plan & billing</h2>
        <p className="text-sm mb-4" style={{ color: "var(--brand-charcoal-soft)" }}>
          You're on the free plan.
        </p>
        <div className="rounded-2xl p-5 mb-4" style={{ background: "#1A1A1A" }}>
          <div className="text-xs font-semibold mb-1" style={{ color: "#888" }}>CURRENT PLAN</div>
          <div className="text-xl font-semibold mb-1" style={{ color: "#fff" }}>Free</div>
          <div className="text-xs mb-4" style={{ color: "#888" }}>3 schedule entries · Public page · Basic profile</div>
          <Link href="/pricing"
            className="block text-center text-sm font-semibold py-3 rounded-xl"
            style={{ background: "var(--brand-green)", color: "var(--brand-green-darker)" }}>
            Upgrade to Pro — from $14.99/month
          </Link>
        </div>
        <div className="rounded-xl p-4" style={{ background: "var(--brand-green-light)", border: "0.5px solid var(--brand-green)" }}>
          <div className="text-sm font-medium mb-1" style={{ color: "var(--brand-green-dark)" }}>🎁 Founding vendor offer</div>
          <div className="text-xs" style={{ color: "var(--brand-green-dark)", opacity: 0.85 }}>
            Have a promo code? Apply it at checkout on the pricing page for your exclusive founding discount.
          </div>
          <Link href="/pricing" className="text-xs font-semibold mt-2 block underline" style={{ color: "var(--brand-green-dark)" }}>
            Go to pricing →
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-base font-medium mb-1">Plan & billing</h2>
      <p className="text-sm mb-4" style={{ color: "var(--brand-charcoal-soft)" }}>
        Manage your subscription, payment method, and invoices.
      </p>

      {subscription && (
        <div className="rounded-2xl p-5 mb-4" style={{ background: "#1A1A1A" }}>
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="text-xs font-semibold mb-1" style={{ color: "#888" }}>CURRENT PLAN</div>
              <div className="text-xl font-semibold mb-1" style={{ color: "var(--brand-green)" }}>
                {PLAN_LABELS[subscription.plan] ?? "Pro"}
              </div>
              <div className="text-xs" style={{ color: "#888" }}>
                Status: <span style={{ color: subscription.status === "active" ? "var(--brand-green)" : "#FF6B6B" }}>
                  {STATUS_LABELS[subscription.status] ?? subscription.status}
                </span>
              </div>
              {subscription.cancel_at_period_end && (
                <div className="text-xs mt-1" style={{ color: "#FF6B6B" }}>
                  Cancels {new Date(subscription.current_period_end).toLocaleDateString()}
                </div>
              )}
              {!subscription.cancel_at_period_end && (
                <div className="text-xs mt-1" style={{ color: "#888" }}>
                  Renews {new Date(subscription.current_period_end).toLocaleDateString()}
                </div>
              )}
            </div>
            <span className="text-xs px-2 py-1 rounded-full font-semibold flex-shrink-0"
              style={{ background: "var(--brand-green)", color: "var(--brand-green-darker)" }}>
              Pro
            </span>
          </div>
        </div>
      )}

      {error && <p className="text-sm mb-3" style={{ color: "#FF6B6B" }}>{error}</p>}

      <div className="space-y-2">
        <button onClick={openPortal} disabled={loading}
          className="w-full text-sm font-semibold py-3 rounded-xl transition disabled:opacity-60"
          style={{ background: "var(--brand-green)", color: "var(--brand-green-darker)" }}>
          {loading ? "Opening..." : "Manage subscription & billing →"}
        </button>
        <p className="text-xs text-center" style={{ color: "var(--brand-charcoal-soft)" }}>
          Change plan, update payment method, view invoices, or cancel — all in the billing portal.
        </p>
      </div>
    </div>
  );
}
