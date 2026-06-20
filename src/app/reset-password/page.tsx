"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Logo } from "@/components/logo";
import { useRouter } from "next/navigation";

export default function ResetPasswordPage() {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    if (password !== confirm) {
      setError("Passwords don't match.");
      return;
    }

    setLoading(true);
    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({ password });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    setDone(true);
    setTimeout(() => router.push("/dashboard"), 2000);
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-white">
      <div className="w-full max-w-sm">
        <div className="flex justify-center mb-8">
          <Logo variant="full" size={36} />
        </div>

        {done ? (
          <div className="text-center">
            <div className="text-4xl mb-4">✅</div>
            <h1 className="text-xl font-medium mb-2">Password updated!</h1>
            <p className="text-sm" style={{ color: "var(--brand-charcoal-soft)" }}>
              Redirecting you to your dashboard...
            </p>
          </div>
        ) : (
          <>
            <h1 className="text-xl font-medium text-center mb-1">Set a new password</h1>
            <p className="text-sm text-center mb-6" style={{ color: "var(--brand-charcoal-soft)" }}>
              Choose a new password for your account.
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1.5">New password</label>
                <input type="password" required value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="At least 6 characters"
                  className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2"
                  style={{ borderColor: "var(--brand-line)" }} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">Confirm password</label>
                <input type="password" required value={confirm}
                  onChange={e => setConfirm(e.target.value)}
                  placeholder="Repeat your new password"
                  className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2"
                  style={{ borderColor: "var(--brand-line)" }} />
              </div>

              {error && <p className="text-sm" style={{ color: "#A32D2D" }}>{error}</p>}

              <button type="submit" disabled={loading}
                className="w-full rounded-lg py-2.5 text-sm font-medium text-white disabled:opacity-60"
                style={{ background: "var(--brand-green)" }}>
                {loading ? "Saving..." : "Update password"}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
