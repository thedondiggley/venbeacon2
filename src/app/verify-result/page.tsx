import { Logo } from "@/components/logo";
import Link from "next/link";

type PageProps = { searchParams: Promise<{ status?: string; slug?: string }> };

export default async function VerifyResultPage({ searchParams }: PageProps) {
  const { status, slug } = await searchParams;

  const content = {
    success: {
      icon: "🎉",
      title: "Your venue is live!",
      body: "Food truck operators in your area can now find you on the VendorBeacon board and reach out directly.",
    },
    already: {
      icon: "✅",
      title: "Already verified",
      body: "This listing was already confirmed and is live on the board.",
    },
    invalid: {
      icon: "⚠️",
      title: "Link invalid or expired",
      body: "This verification link isn't valid. If you recently submitted a listing, check your email for the most recent confirmation link, or submit a new listing.",
    },
    error: {
      icon: "❌",
      title: "Something went wrong",
      body: "We couldn't verify your listing right now. Please try again or contact support.",
    },
  }[status ?? "invalid"] ?? {
    icon: "⚠️",
    title: "Link invalid",
    body: "This verification link isn't valid.",
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-white">
      <div className="text-center max-w-sm">
        <Logo variant="mark" size={48} className="mx-auto mb-6" />
        <div className="text-4xl mb-4">{content.icon}</div>
        <h1 className="text-xl font-medium mb-3">{content.title}</h1>
        <p className="text-sm mb-6" style={{ color: "var(--brand-charcoal-soft)" }}>{content.body}</p>

        <div className="flex gap-3 justify-center">
          {slug && (status === "success" || status === "already") && (
            <a href={`/venue/${slug}`}
              className="rounded-lg px-4 py-2 text-sm font-medium text-white"
              style={{ background: "var(--brand-green)" }}>
              View my listing
            </a>
          )}
          <Link href="/"
            className="rounded-lg px-4 py-2 text-sm font-medium border"
            style={{ borderColor: "var(--brand-line)", color: "var(--brand-charcoal)" }}>
            Go home
          </Link>
        </div>

        {status === "invalid" && (
          <p className="text-sm mt-4">
            <a href="/list-your-venue" className="underline" style={{ color: "var(--brand-green-dark)" }}>
              Submit a new listing
            </a>
          </p>
        )}
      </div>
    </div>
  );
}
