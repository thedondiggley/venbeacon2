"use client";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { Button, Input } from "@/components/ui";
import Link from "next/link";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const supabase = createClient();
      const { error: err } = await supabase.auth.signInWithPassword({ email, password });
      if (err) throw err;
      router.push("/dashboard");
      router.refresh();
    } catch (err: any) {
      setError("Incorrect email or password.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 16 }}>
      {/* Logo */}
      <Link href="/" style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none", marginBottom: 40 }}>
        <div style={{ width: 40, height: 40, background: "var(--green)", borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <span style={{ color: "var(--green-dark)", fontWeight: 800, fontSize: 20 }}>V</span>
        </div>
        <span style={{ fontWeight: 800, fontSize: 20, color: "var(--text)", letterSpacing: "-0.02em" }}>VendorBeacon</span>
      </Link>

      {/* Card */}
      <div style={{
        width: "100%", maxWidth: 400,
        background: "var(--surface)",
        borderRadius: "var(--r-xl)",
        border: "1px solid var(--border)",
        boxShadow: "var(--shadow-lg)",
        overflow: "hidden",
      }}>
        <div style={{ padding: "28px 28px 0" }}>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: "var(--text)", marginBottom: 6, letterSpacing: "-0.02em" }}>Welcome back</h1>
          <p style={{ fontSize: 14, color: "var(--text-3)", marginBottom: 24 }}>Log in to your VendorBeacon account</p>
        </div>

        <form onSubmit={handleLogin} style={{ padding: "0 28px 28px", display: "flex", flexDirection: "column", gap: 16 }}>
          <Input
            label="Email"
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="you@example.com"
            required
            autoComplete="email"
          />
          <div>
            <Input
              label="Password"
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              autoComplete="current-password"
            />
            <div style={{ textAlign: "right", marginTop: 8 }}>
              <Link href="/forgot-password" style={{ fontSize: 13, color: "var(--green-mid)", fontWeight: 600, textDecoration: "none" }}>
                Forgot password?
              </Link>
            </div>
          </div>

          {error && (
            <div style={{ padding: "12px 14px", background: "var(--danger-bg)", borderRadius: "var(--r-md)", border: "1px solid var(--danger)" }}>
              <p style={{ fontSize: 13, color: "var(--danger)", fontWeight: 600 }}>⚠ {error}</p>
            </div>
          )}

          <Button type="submit" loading={loading} fullWidth size="lg">
            {loading ? "Signing in..." : "Sign in"}
          </Button>
        </form>
      </div>

      <p style={{ marginTop: 20, fontSize: 14, color: "var(--text-3)" }}>
        Don&apos;t have an account?{" "}
        <Link href="/signup" style={{ color: "var(--green-mid)", fontWeight: 700, textDecoration: "none" }}>
          Sign up free
        </Link>
      </p>
    </div>
  );
}
