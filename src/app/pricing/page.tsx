"use client";

import { useState } from "react";
import { Logo } from "@/components/logo";

const FREE_FEATURES = [
  "Vendor profile",
  "Public truck page",
  "Custom shareable URL",
  "Instagram, Facebook & TikTok links",
  "Public schedule page",
  "Up to 3 active schedule entries",
  "Visible in venue search results",
];

const PRO_FEATURES = [
  "Everything in Free",
  "Unlimited schedule entries",
  "Venue board access",
  "Venue contact information",
  "Direct venue outreach",
  "Booking request inbox",
  "Approve & decline bookings",
  "Auto-add approved bookings to schedule",
  "Saved venues & opportunities",
  "Analytics dashboard",
];

export default function PricingPage() {
  const [loading, setLoading] = useState<"monthly" | "annual" | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleUpgrade(plan: "monthly" | "annual") {
    setError(null);
    setLoading(plan);

    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (res.status === 401) {
          window.location.href = "/signup";
          return;
        }
        throw new Error(data.error ?? "Something went wrong");
      }

      if (data.url) {
        window.location.href = data.url;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setLoading(null);
    }
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="flex justify-center mb-10">
          <a href="/">
            <Logo variant="full" size={36} />
          </a>
        </div>

        <div className="text-center mb-12">
          <h1 className="text-3xl font-bold mb-3" style={{ color: "var(--brand-charcoal)" }}>
            Simple, transparent pricing
          </h1>
          <p className="text-base max-w-md mx-auto" style={{ color: "var(--brand-charcoal-soft)" }}>
            Start free. Upgrade when you're ready to find new locations and grow your bookings.
          </p>
        </div>

        {error && (
          <div className="max-w-md mx-auto mb-6 rounded-lg border p-3 text-sm text-center" style={{ borderColor: "#F09595", color: "#A32D2D" }}>
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">

          {/* FREE */}
          <div className="rounded-2xl border p-6 flex flex-col" style={{ borderColor: "var(--brand-line)" }}>
            <div className="mb-6">
              <div className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: "var(--brand-charcoal-soft)" }}>Free</div>
              <div className="flex items-end gap-1">
                <span className="text-4xl font-bold" style={{ color: "var(--brand-charcoal)" }}>$0</span>
                <span className="text-sm mb-1" style={{ color: "var(--brand-charcoal-soft)" }}>/month</span>
              </div>
              <p className="text-sm mt-2" style={{ color: "var(--brand-charcoal-soft)" }}>Build your public presence and get found.</p>
            </div>

            <ul className="space-y-2 flex-1 mb-6">
              {FREE_FEATURES.map((f) => (
                <li key={f} className="flex items-start gap-2 text-sm">
                  <span style={{ color: "var(--brand-green)" }}>✓</span>
                  <span style={{ color: "var(--brand-charcoal)" }}>{f}</span>
                </li>
              ))}
            </ul>

            <a
              href="/signup"
              className="block text-center rounded-xl py-3 text-sm font-medium border transition"
              style={{ borderColor: "var(--brand-line)", color: "var(--brand-charcoal)" }}
            >
              Get started free
            </a>
          </div>

          {/* PRO MONTHLY */}
          <div className="rounded-2xl border p-6 flex flex-col" style={{ borderColor: "var(--brand-line)" }}>
            <div className="mb-6">
              <div className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: "var(--brand-charcoal-soft)" }}>Pro Monthly</div>
              <div className="flex items-end gap-1">
                <span className="text-4xl font-bold" style={{ color: "var(--brand-charcoal)" }}>$25</span>
                <span className="text-sm mb-1" style={{ color: "var(--brand-charcoal-soft)" }}>/month</span>
              </div>
              <p className="text-sm mt-2" style={{ color: "var(--brand-charcoal-soft)" }}>Full access. Cancel anytime.</p>
            </div>

            <ul className="space-y-2 flex-1 mb-6">
              {PRO_FEATURES.map((f) => (
                <li key={f} className="flex items-start gap-2 text-sm">
                  <span style={{ color: "var(--brand-green)" }}>✓</span>
                  <span style={{ color: "var(--brand-charcoal)" }}>{f}</span>
                </li>
              ))}
            </ul>

            <button
              onClick={() => handleUpgrade("monthly")}
              disabled={loading !== null}
              className="rounded-xl py-3 text-sm font-medium border transition disabled:opacity-60"
              style={{ borderColor: "var(--brand-green)", color: "var(--brand-green-dark)", background: "var(--brand-green-light)" }}
            >
              {loading === "monthly" ? "Redirecting..." : "Upgrade to Pro"}
            </button>
          </div>

          {/* PRO ANNUAL */}
          <div className="rounded-2xl p-6 flex flex-col relative" style={{ background: "var(--brand-green)", border: "2px solid var(--brand-green)" }}>
            {/* Recommended badge */}
            <div className="absolute -top-3 left-1/2 -translate-x-1/2">
              <span className="bg-white text-xs font-bold px-3 py-1 rounded-full shadow-sm" style={{ color: "var(--brand-green-dark)" }}>
                BEST VALUE
              </span>
            </div>

            <div className="mb-6">
              <div className="text-xs font-semibold uppercase tracking-wider mb-2 text-white opacity-80">Pro Annual</div>
              <div className="flex items-end gap-1">
                <span className="text-4xl font-bold text-white">$225</span>
                <span className="text-sm mb-1 text-white opacity-80">/year</span>
              </div>
              <div className="mt-2 space-y-0.5">
                <p className="text-sm text-white font-medium">Save $75 per year</p>
                <p className="text-sm text-white opacity-80">3 months free vs monthly</p>
              </div>
            </div>

            <ul className="space-y-2 flex-1 mb-6">
              {PRO_FEATURES.map((f) => (
                <li key={f} className="flex items-start gap-2 text-sm">
                  <span className="text-white">✓</span>
                  <span className="text-white">{f}</span>
                </li>
              ))}
            </ul>

            <button
              onClick={() => handleUpgrade("annual")}
              disabled={loading !== null}
              className="rounded-xl py-3 text-sm font-bold transition disabled:opacity-60"
              style={{ background: "#fff", color: "var(--brand-green-dark)" }}
            >
              {loading === "annual" ? "Redirecting..." : "Get Pro Annual"}
            </button>
          </div>

        </div>

        <p className="text-center text-xs mt-8" style={{ color: "var(--brand-charcoal-soft)" }}>
          All plans include a public vendor profile visible to venues and customers.
          Upgrade or cancel anytime from your dashboard settings.
        </p>

        <div className="text-center mt-6">
          <a href="/dashboard" className="text-sm underline" style={{ color: "var(--brand-charcoal-soft)" }}>
            Back to dashboard
          </a>
        </div>
      </div>
    </div>
  );
}
