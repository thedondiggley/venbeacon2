"use client";
import { useState } from "react";
import Link from "next/link";
import { Button, Card, Badge, AlertBanner } from "@/components/ui";

type Subscription = { plan: string; status: string; current_period_end: string; cancel_at_period_end: boolean; } | null;
const PLAN_LABELS: Record<string, string> = { pro_monthly: "Pro Monthly — $14.99/month", pro_annual: "Pro Annual — $99/year" };
const STATUS_LABELS: Record<string, string> = { active: "Active", trialing: "Trial", past_due: "Past due", canceled: "Canceled", unpaid: "Unpaid" };

export function BillingSection({ isPro, subscription, hasStripeCustomer }: { isPro: boolean; subscription: Subscription; hasStripeCustomer: boolean }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function openPortal() {
    setError(null); setLoading(true);
    try {
      const res = await fetch("/api/stripe/portal", { method: "POST" });
      const data = await res.json();
      if (data.url) window.location.href = data.url;
      else throw new Error(data.error ?? "Failed to open portal");
    } catch (err: any) { setError(err.message); setLoading(false); }
  }

  if (!isPro) return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div>
        <h2 style={{ fontSize: 16, fontWeight: 700, color: "var(--text)", marginBottom: 4 }}>Plan and billing</h2>
        <p style={{ fontSize: 14, color: "var(--text-3)" }}>You're on the free plan.</p>
      </div>
      <Card variant="dark" padding="md">
        <p style={{ fontSize: 11, fontWeight: 700, color: "var(--text-on-dark-3)", textTransform: "uppercase", letterSpacing: ".06em", marginBottom: 8 }}>Current plan</p>
        <p style={{ fontSize: 24, fontWeight: 700, color: "#fff", marginBottom: 4 }}>Free</p>
        <p style={{ fontSize: 13, color: "var(--text-on-dark-3)", marginBottom: 20 }}>3 schedule entries · Public page · Shareable link</p>
        <Link href="/pricing" style={{ display: "block", textAlign: "center", background: "var(--green)", color: "var(--green-dark)", fontSize: 14, fontWeight: 700, padding: "12px", borderRadius: 9999, textDecoration: "none" }}>
          Upgrade to Pro — from $14.99/month
        </Link>
      </Card>
      <div style={{ padding: "14px 16px", background: "var(--green-light)", borderRadius: "var(--r-md)", border: "1px solid var(--green-border)" }}>
        <p style={{ fontSize: 14, fontWeight: 700, color: "var(--green-dark)", marginBottom: 4 }}>🎁 Founding vendor offer</p>
        <p style={{ fontSize: 13, color: "var(--green-dark)", opacity: 0.9, marginBottom: 10 }}>Have a promo code? Apply it at checkout for your exclusive founding discount — first year for $25.</p>
        <Link href="/pricing" style={{ fontSize: 13, fontWeight: 700, color: "var(--green-dark)", textDecoration: "none" }}>View pricing and plans →</Link>
      </div>
    </div>
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div>
        <h2 style={{ fontSize: 16, fontWeight: 700, color: "var(--text)", marginBottom: 4 }}>Plan and billing</h2>
        <p style={{ fontSize: 14, color: "var(--text-3)" }}>Manage your subscription, payment method, and invoices.</p>
      </div>
      {subscription && (
        <Card variant="dark" padding="md">
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
            <div>
              <p style={{ fontSize: 11, fontWeight: 700, color: "var(--text-on-dark-3)", textTransform: "uppercase", letterSpacing: ".06em", marginBottom: 8 }}>Current plan</p>
              <p style={{ fontSize: 20, fontWeight: 700, color: "var(--green)", marginBottom: 6 }}>{PLAN_LABELS[subscription.plan] ?? "Pro"}</p>
              <p style={{ fontSize: 13, color: "var(--text-on-dark-3)", marginBottom: 4 }}>
                Status: <span style={{ color: subscription.status === "active" ? "var(--green)" : "var(--danger)", fontWeight: 700 }}>{STATUS_LABELS[subscription.status] ?? subscription.status}</span>
              </p>
              {subscription.cancel_at_period_end
                ? <p style={{ fontSize: 13, color: "var(--danger)" }}>Cancels {new Date(subscription.current_period_end).toLocaleDateString()}</p>
                : <p style={{ fontSize: 13, color: "var(--text-on-dark-3)" }}>Renews {new Date(subscription.current_period_end).toLocaleDateString()}</p>
              }
            </div>
            <Badge variant="green">Pro</Badge>
          </div>
        </Card>
      )}
      {subscription?.cancel_at_period_end && (
        <AlertBanner type="warning" title="Your subscription is set to cancel" description="Your Pro access will end on the date shown above. Reactivate anytime in the billing portal." />
      )}
      {error && <AlertBanner type="danger" title={error} />}
      <Button onClick={openPortal} loading={loading} fullWidth size="lg">
        Manage subscription and billing
      </Button>
      <p style={{ fontSize: 13, color: "var(--text-3)", textAlign: "center" }}>
        Change plan, update payment method, view invoices, or cancel — all in the Stripe billing portal.
      </p>
    </div>
  );
}
