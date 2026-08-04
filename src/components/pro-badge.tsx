export function ProBadge({ isPro }: { isPro: boolean }) {
  if (!isPro) return null;
  return (
    <span style={{
      background: "var(--green)", color: "var(--green-dark)",
      fontSize: 10, fontWeight: 800, padding: "3px 10px",
      borderRadius: 9999, letterSpacing: ".06em",
    }}>PRO</span>
  );
}
