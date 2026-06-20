"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { createClient } from "@/lib/supabase/client";
import { Logo } from "@/components/logo";

function slugify(input: string) {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

function SignupForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const refCode = searchParams.get("ref");
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

    const { data, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
    });

    if (signUpError) {
      setError(signUpError.message);
      setLoading(false);
      return;
    }

    const userId = data.user?.id;
    if (!userId) {
      setError("Something went wrong creating your account. Try again.");
      setLoading(false);
      return;
    }

    // Look up referrer if a ref code was provided
    let referredBy: string | null = null;
    if (refCode) {
      const { data: referrer } = await supabase
        .from("vendors")
        .select("id")
        .eq("referral_code", refCode)
        .maybeSingle();
      if (referrer) referredBy = referrer.id;
    }

    // Create vendor record
    const baseSlug = slugify(businessName) || "vendor";
    let slug = baseSlug;
    let attempt = 0;

    while (attempt < 5) {
      const { data: inserted, error: insertError } = await supabase.from("vendors").insert({
        user_id: userId,
        slug,
        business_name: businessName,
        contact_email: email,
        referred_by: referredBy,
      }).select("id").single();

      if (!insertError) {
        // Generate this vendor's own referral code
        if (inserted) {
          const newCode = `${slug}-${inserted.id.slice(0, 6)}`;
          await supabase.from("vendors").update({ referral_code: newCode }).eq("id", inserted.id);
        }
        break;
      }

      if (insertError.code === "23505") {
        attempt += 1;
        slug = `${baseSlug}-${Math.floor(Math.random() * 1000)}`;
        continue;
      }

      setError(insertError.message);
      setLoading(false);
      return;
    }

    // Send welcome email — await it so page doesn't unload before fetch fires
    try {
      await fetch("/api/auth/welcome", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });
    } catch {
      // Don't block signup if email fails
    }

    router.push("/onboarding");
    router.refresh();
  }

  return (
    <div className="w-full max-w-sm">
      <div className="flex justify-center mb-8">
        <Logo variant="full" size={40} />
      </div>

      <h1 className="text-xl font-medium text-center mb-1">Create your account</h1>
      <p className="text-sm text-center mb-8" style={{ color: "var(--brand-charcoal-soft)" }}>
        Set up your truck&apos;s schedule page in a couple minutes.
      </p>

      {refCode && (
        <div className="rounded-lg p-3 mb-4 text-sm text-center" style={{ background: "var(--brand-green-light)", color: "var(--brand-green-dark)" }}>
          You were referred by a fellow vendor 🎉
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="businessName" className="block text-sm font-medium mb-1.5">
            Business name
          </label>
          <input
            id="businessName"
            type="text"
            required
            value={businessName}
            onChange={(e) => setBusinessName(e.target.value)}
            placeholder="My Food Truck"
            className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2"
            style={{ borderColor: "var(--brand-line)" }}
          />
        </div>

        <div>
          <label htmlFor="email" className="block text-sm font-medium mb-1.5">
            Email
          </label>
          <input
            id="email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2"
            style={{ borderColor: "var(--brand-line)" }}
          />
        </div>

        <div>
          <label htmlFor="password" className="block text-sm font-medium mb-1.5">
            Password
          </label>
          <input
            id="password"
            type="password"
            required
            minLength={6}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="At least 6 characters"
            className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2"
            style={{ borderColor: "var(--brand-line)" }}
          />
        </div>

        {error && (
          <p className="text-sm" style={{ color: "#A32D2D" }}>
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg py-2.5 text-sm font-medium text-white transition disabled:opacity-60"
          style={{ background: "var(--brand-green)" }}
        >
          {loading ? "Creating account..." : "Create account"}
        </button>
      </form>

      <p className="text-sm text-center mt-6" style={{ color: "var(--brand-charcoal-soft)" }}>
        Already have an account?{" "}
        <a href="/login" className="font-medium underline" style={{ color: "var(--brand-green-dark)" }}>
          Log in
        </a>
      </p>
    </div>
  );
}

export default function SignupPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-12 bg-white">
      <Suspense fallback={<div className="text-sm" style={{ color: "var(--brand-charcoal-soft)" }}>Loading...</div>}>
        <SignupForm />
      </Suspense>
    </div>
  );
}
