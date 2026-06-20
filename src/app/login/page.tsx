"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Logo } from "@/components/logo";

function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const searchParams = useSearchParams();
  const isDisabled = searchParams.get("disabled") === "1";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const supabase = createClient();
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (signInError) {
      setError(signInError.message);
      setLoading(false);
      return;
    }

    router.push("/dashboard");
    router.refresh();
  }

  return (
    <div className="w-full max-w-sm">
      <div className="flex justify-center mb-8">
        <Logo variant="full" size={40} />
      </div>

      <h1 className="text-xl font-medium text-center mb-1">Log in</h1>
      {isDisabled && (
        <div className="rounded-lg p-3 mb-4 text-sm text-center" style={{ background: "#FEE2E2", color: "#991B1B" }}>
          This account has been disabled. Contact <a href="/contact" className="underline">support</a> if you believe this is a mistake.
        </div>
      )}
      <p className="text-sm text-center mb-8" style={{ color: "var(--brand-charcoal-soft)" }}>
        Welcome back.
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
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
            value={password}
            onChange={(e) => setPassword(e.target.value)}
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
          {loading ? "Logging in..." : "Log in"}
        </button>
      </form>

      <p className="text-sm text-center mt-4" style={{ color: "var(--brand-charcoal-soft)" }}>
        <a href="/forgot-password" className="underline" style={{ color: "var(--brand-charcoal-soft)" }}>
          Forgot your password?
        </a>
      </p>

      <p className="text-sm text-center mt-3" style={{ color: "var(--brand-charcoal-soft)" }}>
        Don&apos;t have an account?{" "}
        <a href="/signup" className="font-medium underline" style={{ color: "var(--brand-green-dark)" }}>
          Sign up
        </a>
      </p>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-12 bg-white">
      <Suspense fallback={<div className="w-full max-w-sm text-center text-sm" style={{ color: "var(--brand-charcoal-soft)" }}>Loading...</div>}>
        <LoginForm />
      </Suspense>
    </div>
  );
}
