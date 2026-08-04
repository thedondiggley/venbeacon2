"use client";

import { useState } from "react";

export function ReferralSection({ referralCode, referralRewardMonths, referralRewardAppliedUntil, referralCount }: {
  referralCode: string | null;
  referralRewardMonths: number;
  referralRewardAppliedUntil: string | null;
  referralCount: number;
}) {
  const [copied, setCopied] = useState(false);
  const appUrl = typeof window !== "undefined" ? window.location.origin : "https://vendorbeacon.app";
  const referralLink = referralCode ? `${appUrl}/signup?ref=${referralCode}` : "";
  const rewardActive = referralRewardAppliedUntil && new Date(referralRewardAppliedUntil) > new Date();

  function copyLink() {
    if (!referralLink) return;
    navigator.clipboard.writeText(referralLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div>
      <h2 className="text-base font-medium mb-1">Refer other food trucks</h2>
      <p className="text-sm mb-4" style={{ color: "var(--brand-charcoal-soft)" }}>
        Share your link. When someone you refer upgrades to Pro, you get a free month — automatically.
      </p>

      <div className="rounded-2xl p-5 mb-4" style={{ background: "#1A1A1A" }}>
        <div className="text-xs font-semibold mb-2" style={{ color: "#888" }}>YOUR REFERRAL LINK</div>
        <div className="flex gap-2 mb-3">
          <input type="text" readOnly value={referralLink}
            className="flex-1 rounded-xl px-3 py-2 text-xs font-mono"
            style={{ background: "#242424", color: "var(--brand-green)", border: "0.5px solid #333" }} />
          <button onClick={copyLink}
            className="shrink-0 rounded-xl px-4 py-2 text-xs font-semibold"
            style={{ background: copied ? "var(--brand-green-dark)" : "var(--brand-green)", color: "var(--brand-green-darker)" }}>
            {copied ? "Copied!" : "Copy"}
          </button>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-xl p-3 text-center" style={{ background: "#242424" }}>
            <div className="text-2xl font-semibold" style={{ color: "var(--brand-green)" }}>{referralCount}</div>
            <div className="text-xs mt-0.5" style={{ color: "#888" }}>People referred</div>
          </div>
          <div className="rounded-xl p-3 text-center" style={{ background: "#242424" }}>
            <div className="text-2xl font-semibold" style={{ color: "var(--brand-green)" }}>{referralRewardMonths}</div>
            <div className="text-xs mt-0.5" style={{ color: "#888" }}>Free months earned</div>
          </div>
        </div>
      </div>

      {rewardActive && (
        <div className="rounded-xl p-3" style={{ background: "var(--brand-green-light)", border: "0.5px solid var(--brand-green)" }}>
          <p className="text-xs font-medium" style={{ color: "var(--brand-green-dark)" }}>
            ✓ Your Pro access is covered by referral rewards through{" "}
            {new Date(referralRewardAppliedUntil!).toLocaleDateString()}
          </p>
        </div>
      )}
    </div>
  );
}
