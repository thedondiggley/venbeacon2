import Link from "next/link";

export default function NotFound() {
  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 24 }}>
      <div style={{ width: 64, height: 64, background: "var(--green)", borderRadius: 16, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 24 }}>
        <span style={{ fontSize: 32, fontWeight: 800, color: "var(--green-dark)" }}>V</span>
      </div>
      <h1 style={{ fontSize: 80, fontWeight: 800, color: "var(--text)", letterSpacing: "-0.04em", lineHeight: 1, marginBottom: 8 }}>404</h1>
      <p style={{ fontSize: 20, fontWeight: 700, color: "var(--text)", marginBottom: 8 }}>Page not found</p>
      <p style={{ fontSize: 15, color: "var(--text-3)", marginBottom: 32, textAlign: "center", maxWidth: 320 }}>
        This page doesn't exist or has been moved. Head back to the dashboard.
      </p>
      <div style={{ display: "flex", gap: 12 }}>
        <Link href="/dashboard" style={{ background: "var(--green)", color: "var(--green-dark)", fontSize: 14, fontWeight: 700, padding: "11px 24px", borderRadius: 9999, textDecoration: "none" }}>
          Go to dashboard
        </Link>
        <Link href="/" style={{ background: "var(--surface)", color: "var(--text-2)", fontSize: 14, fontWeight: 600, padding: "11px 24px", borderRadius: 9999, textDecoration: "none", border: "1px solid var(--border-2)" }}>
          Home
        </Link>
      </div>
    </div>
  );
}
