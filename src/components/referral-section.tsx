"use client";

import { useState } from "react";

export function ReferralSection({
  referralCode,
  referralRewardMonths,
  referralRewardAppliedUntil,
  referralCount,
}: {
  referralCode: string | null;
  referralRewardMonths: number;
  referralRewardAppliedUntil: string | null;
  referralCount: number;
}) {
  const [copied, setCopied] = useState(false);
  const appUrl = typeof window !== "undefined" ? window.location.origin : "https://vendorbeacon.app";
  const referralLink = referralCode ? `${appUrl}/signup?ref=${referralCode}` : "";

  function copyLink() {
    if (!referralLink) return;
    navigator.clipboard.writeText(referralLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const rewardActive = referralRewardAppliedUntil && new Date(referralRewardAppliedUntil) > new Date();

  return (
    <div>
      <h2 className="text-base font-medium mb-1">Refer other food trucks</h2>
      <p className="text-sm mb-4" style={{ color: "var(--brand-charcoal-soft)" }}>
        Share your link. When someone you refer upgrades to Pro, you get a free month — automatically.
      </p>

      <div className="rounded-lg border p-4 mb-4" style={{ borderColor: "var(--brand-line)" }}>
        <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--brand-charcoal-soft)" }}>
          Your referral link
        </label>
        <div className="flex gap-2">
          <input
            type="text"
            readOnly
            value={referralLink}
            className="flex-1 rounded-lg border px-3 py-2 text-sm bg-gray-50"
            style={{ borderColor: "var(--brand-line)" }}
          />
          <button
            onClick={copyLink}
            className="shrink-0 rounded-lg px-4 py-2 text-sm font-medium text-white"
            style={{ background: copied ? "var(--brand-green-dark)" : "var(--brand-green)" }}>
            {copied ? "Copied!" : "Copy"}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-lg border p-3 text-center" style={{ borderColor: "var(--brand-line)" }}>
          <div className="text-xl font-bold" style={{ color: "var(--brand-green)" }}>{referralCount}</div>
          <div className="text-xs mt-0.5" style={{ color: "var(--brand-charcoal-soft)" }}>People referred</div>
        </div>
        <div className="rounded-lg border p-3 text-center" style={{ borderColor: "var(--brand-line)" }}>
          <div className="text-xl font-bold" style={{ color: "var(--brand-green)" }}>{referralRewardMonths}</div>
          <div className="text-xs mt-0.5" style={{ color: "var(--brand-charcoal-soft)" }}>Free months earned</div>
        </div>
      </div>

      {rewardActive && (
        <p className="text-xs mt-3" style={{ color: "var(--brand-green-dark)" }}>
          ✓ Your Pro access is covered by referral rewards through{" "}
          {new Date(referralRewardAppliedUntil!).toLocaleDateString()}
        </p>
      )}
    </div>
  );
}
