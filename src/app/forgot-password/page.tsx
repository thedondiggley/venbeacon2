"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Logo } from "@/components/logo";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const supabase = createClient();
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://vendorbeacon.app";

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${appUrl}/reset-password`,
    });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    setSent(true);
    setLoading(false);
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-white">
      <div className="w-full max-w-sm">
        <div className="flex justify-center mb-8">
          <Logo variant="full" size={36} />
        </div>

        {sent ? (
          <div className="text-center">
            <div className="text-4xl mb-4">📬</div>
            <h1 className="text-xl font-medium mb-2">Check your email</h1>
            <p className="text-sm" style={{ color: "var(--brand-charcoal-soft)" }}>
              We sent a password reset link to <strong>{email}</strong>. Check your inbox and click the link to set a new password.
            </p>
            <p className="text-sm mt-4" style={{ color: "var(--brand-charcoal-soft)" }}>
              <a href="/login" className="underline" style={{ color: "var(--brand-green-dark)" }}>
                Back to login
              </a>
            </p>
          </div>
        ) : (
          <>
            <h1 className="text-xl font-medium text-center mb-1">Reset your password</h1>
            <p className="text-sm text-center mb-6" style={{ color: "var(--brand-charcoal-soft)" }}>
              Enter your email and we'll send you a reset link.
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1.5">Email address</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2"
                  style={{ borderColor: "var(--brand-line)" }}
                />
              </div>

              {error && <p className="text-sm" style={{ color: "#A32D2D" }}>{error}</p>}

              <button type="submit" disabled={loading}
                className="w-full rounded-lg py-2.5 text-sm font-medium text-white disabled:opacity-60"
                style={{ background: "var(--brand-green)" }}>
                {loading ? "Sending..." : "Send reset link"}
              </button>
            </form>

            <p className="text-sm text-center mt-6" style={{ color: "var(--brand-charcoal-soft)" }}>
              <a href="/login" className="underline" style={{ color: "var(--brand-charcoal-soft)" }}>
                Back to login
              </a>
            </p>
          </>
        )}
      </div>
    </div>
  );
}
