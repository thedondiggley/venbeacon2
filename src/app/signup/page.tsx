"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button, Input, Card } from "@/components/ui";
import Link from "next/link";

function slugify(input: string) {
  return input.toLowerCase().trim().replace(/[^a-z0-9\s-]/g, "").replace(/\s+/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "");
}

function SignupForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const refCode = searchParams.get("ref");
  const isEarlyAdopter = searchParams.get("early") === "1";

  const [businessName, setBusinessName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const supabase = createClient();

    const { data, error: signUpError } = await supabase.auth.signUp({ email, password });
    if (signUpError) { setError(signUpError.message); setLoading(false); return; }

    const userId = data.user?.id;
    if (!userId) { setError("Something went wrong. Please try again."); setLoading(false); return; }

    let referredBy: string | null = null;
    if (refCode) {
      const { data: referrer } = await supabase.from("vendors").select("id").eq("referral_code", refCode).maybeSingle();
      if (referrer) referredBy = referrer.id;
    }

    const baseSlug = slugify(businessName) || "vendor";
    let slug = baseSlug;
    let attempt = 0;

    while (attempt < 5) {
      const { data: inserted, error: insertError } = await supabase.from("vendors").insert({
        user_id: userId, slug, business_name: businessName, contact_email: email,
        referred_by: referredBy, is_early_adopter: isEarlyAdopter,
      }).select("id").single();

      if (!insertError) {
        if (inserted) {
          const newCode = `${slug}-${inserted.id.slice(0, 6)}`;
          await supabase.from("vendors").update({ referral_code: newCode }).eq("id", inserted.id);
        }
        break;
      }
      if (insertError.code === "23505") { attempt++; slug = `${baseSlug}-${Math.floor(Math.random() * 1000)}`; continue; }
      setError(insertError.message); setLoading(false); return;
    }

    try {
      await fetch("/api/auth/welcome", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ userId, isEarlyAdopter }) });
    } catch {}

    router.push("/onboarding");
    router.refresh();
  }

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: "24px 16px", background: "var(--bg)" }}>
      <div style={{ width: "100%", maxWidth: 400 }}>
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <a href="/" style={{ display: "inline-flex", alignItems: "center", gap: 10, textDecoration: "none" }}>
            <div style={{ width: 40, height: 40, background: "var(--green)", borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <span style={{ fontSize: 20, fontWeight: 800, color: "var(--green-dark)" }}>V</span>
            </div>
            <span style={{ fontSize: 20, fontWeight: 800, color: "var(--text)", letterSpacing: "-0.02em" }}>VendorBeacon</span>
          </a>
        </div>

        <Card variant="default" padding="lg">
          <h1 style={{ fontSize: 22, fontWeight: 800, color: "var(--text)", marginBottom: 4, letterSpacing: "-0.02em" }}>Create your account</h1>
          <p style={{ fontSize: 14, color: "var(--text-3)", marginBottom: 24 }}>Set up your truck's schedule page in minutes</p>

          {isEarlyAdopter && (
            <div style={{ background: "var(--green-light)", border: "1px solid var(--green-border)", borderRadius: "var(--r-md)", padding: "12px 16px", marginBottom: 20, fontSize: 13, color: "var(--green-mid)", fontWeight: 600 }}>
              You're claiming a founding vendor spot — I'll reach out personally with your promo code.
            </div>
          )}

          {refCode && !isEarlyAdopter && (
            <div style={{ background: "var(--green-light)", border: "1px solid var(--green-border)", borderRadius: "var(--r-md)", padding: "12px 16px", marginBottom: 20, fontSize: 13, color: "var(--green-mid)", fontWeight: 600 }}>
              You were referred by a fellow vendor
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <Input label="Business name" value={businessName} onChange={e => setBusinessName(e.target.value)} placeholder="Big Dawg Dogs" required />
            <Input label="Email" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" required autoComplete="email" />
            <Input label="Password" type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="At least 6 characters" required minLength={6} autoComplete="new-password" error={error ?? undefined} />
            <Button type="submit" loading={loading} fullWidth size="lg">Create account — it's free</Button>
          </form>

          <p style={{ fontSize: 12, color: "var(--text-3)", textAlign: "center", marginTop: 16, lineHeight: 1.5 }}>
            By signing up you agree to our{" "}
            <Link href="/terms" style={{ color: "var(--green-mid)", fontWeight: 600 }}>Terms</Link> and{" "}
            <Link href="/privacy" style={{ color: "var(--green-mid)", fontWeight: 600 }}>Privacy Policy</Link>
          </p>

          <div style={{ marginTop: 16, textAlign: "center" }}>
            <p style={{ fontSize: 13, color: "var(--text-3)" }}>
              Already have an account?{" "}
              <Link href="/login" style={{ color: "var(--green-mid)", fontWeight: 700, textDecoration: "none" }}>Sign in</Link>
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
}

export default function SignupPage() {
  return <Suspense fallback={<div />}><SignupForm /></Suspense>;
}
