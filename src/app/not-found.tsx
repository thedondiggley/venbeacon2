import Link from "next/link";
import { Logo } from "@/components/logo";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center px-4 text-center">
      <Logo variant="mark" size={48} className="mb-6" />
      <h1 className="text-6xl font-bold mb-4" style={{ color: "var(--brand-green)" }}>404</h1>
      <h2 className="text-xl font-medium mb-3" style={{ color: "var(--brand-charcoal)" }}>Page not found</h2>
      <p className="text-sm mb-8 max-w-sm" style={{ color: "var(--brand-charcoal-soft)" }}>
        The page you're looking for doesn't exist or has been moved.
      </p>
      <div className="flex gap-3">
        <Link href="/"
          className="rounded-lg px-4 py-2 text-sm font-medium text-white"
          style={{ background: "var(--brand-green)" }}>
          Go home
        </Link>
        <Link href="/dashboard"
          className="rounded-lg px-4 py-2 text-sm font-medium border"
          style={{ borderColor: "var(--brand-line)", color: "var(--brand-charcoal)" }}>
          Dashboard
        </Link>
      </div>
    </div>
  );
}
