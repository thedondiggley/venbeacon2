export function ProBadge({ isPro }: { isPro: boolean }) {
  if (isPro) {
    return (
      <span
        className="text-xs font-bold px-2 py-0.5 rounded-full"
        style={{ background: "var(--brand-green)", color: "#fff" }}
      >
        PRO
      </span>
    );
  }
  return (
    <a
      href="/pricing"
      className="text-xs font-semibold px-2 py-0.5 rounded-full border transition hover:bg-green-50"
      style={{ borderColor: "var(--brand-green)", color: "var(--brand-green-dark)" }}
    >
      Upgrade
    </a>
  );
}
