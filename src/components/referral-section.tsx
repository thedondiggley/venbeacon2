"use client";
import { useState } from "react";
import { Button, Card, useToast } from "@/components/ui";

export function ReferralSection({ referralCode, referralRewardMonths, referralRewardAppliedUntil, referralCount }: {
  referralCode: string | null; referralRewardMonths: number;
  referralRewardAppliedUntil: string | null; referralCount: number;
}) {
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);
  const appUrl = typeof window !== "undefined" ? window.location.origin : "https://vendorbeacon.app";
  const referralLink = referralCode ? `${appUrl}/signup?ref=${referralCode}` : "";
  const rewardActive = referralRewardAppliedUntil && new Date(referralRewardAppliedUntil) > new Date();

  function copyLink() {
    if (!referralLink) return;
    navigator.clipboard.writeText(referralLink);
    setCopied(true);
    toast("Link copied to clipboard!");
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div>
        <h2 style={{ fontSize: 16, fontWeight: 700, color: "var(--text)", marginBottom: 4 }}>Refer other food trucks</h2>
        <p style={{ fontSize: 14, color: "var(--text-3)" }}>Share your link. Every operator you refer who upgrades to Pro earns you a free month — automatically, no limit.</p>
      </div>
      <Card variant="dark" padding="md">
        <p style={{ fontSize: 11, fontWeight: 700, color: "var(--text-on-dark-3)", textTransform: "uppercase", letterSpacing: ".06em", marginBottom: 12 }}>Your referral link</p>
        <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
          <input type="text" readOnly value={referralLink}
            style={{ flex: 1, height: 40, padding: "0 12px", fontSize: 12, fontFamily: "monospace", background: "var(--dark-3)", color: "var(--green)", border: "1px solid var(--border-dark)", borderRadius: "var(--r-md)", outline: "none" }} />
          <button onClick={copyLink} style={{ height: 40, padding: "0 16px", background: copied ? "var(--green-dark)" : "var(--green)", color: copied ? "var(--green)" : "var(--green-dark)", fontSize: 13, fontWeight: 700, borderRadius: "var(--r-md)", border: "none", cursor: "pointer", flexShrink: 0, transition: "all var(--t)" }}>
            {copied ? "Copied!" : "Copy"}
          </button>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          {[{ label: "Referred", value: referralCount }, { label: "Free months earned", value: referralRewardMonths }].map(s => (
            <div key={s.label} style={{ background: "var(--dark-3)", borderRadius: "var(--r-md)", padding: "14px", textAlign: "center" }}>
              <p style={{ fontSize: 28, fontWeight: 700, color: "var(--green)", marginBottom: 4 }}>{s.value}</p>
              <p style={{ fontSize: 12, color: "var(--text-on-dark-3)" }}>{s.label}</p>
            </div>
          ))}
        </div>
      </Card>
      {rewardActive && (
        <div style={{ padding: "14px 16px", background: "var(--green-light)", borderRadius: "var(--r-md)", border: "1px solid var(--green-border)" }}>
          <p style={{ fontSize: 14, fontWeight: 700, color: "var(--green-dark)" }}>✓ Pro access covered by referral rewards</p>
          <p style={{ fontSize: 13, color: "var(--green-dark)", opacity: 0.85, marginTop: 4 }}>Your free months are active through {new Date(referralRewardAppliedUntil!).toLocaleDateString()}.</p>
        </div>
      )}
    </div>
  );
}
