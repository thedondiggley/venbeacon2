"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  { href: "/dashboard", label: "Home", emoji: "⌂", proOnly: false },
  { href: "/dashboard/schedule", label: "Schedule", emoji: "📍", proOnly: false },
  { href: "/dashboard/bookings", label: "Bookings", emoji: "📥", proOnly: true },
  { href: "/dashboard/venues", label: "Venues", emoji: "🏢", proOnly: true },
  { href: "/dashboard/settings", label: "Settings", emoji: "⚙", proOnly: false },
];

export function DashboardNav({ slug, isPro, pendingBookings }: {
  slug: string;
  isPro: boolean;
  pendingBookings: number;
}) {
  const pathname = usePathname();

  return (
    <nav style={{ display: "flex", alignItems: "center", gap: 4, overflowX: "auto", paddingBottom: 2 }}>
      {TABS.map(tab => {
        const active = pathname === tab.href;
        const locked = tab.proOnly && !isPro;
        const showBadge = tab.href === "/dashboard/bookings" && pendingBookings > 0 && isPro;

        return (
          <Link key={tab.href}
            href={locked ? "/pricing" : tab.href}
            style={{
              position: "relative",
              display: "flex",
              alignItems: "center",
              gap: 5,
              padding: "6px 14px",
              borderRadius: 9999,
              fontSize: 13,
              fontWeight: active ? 700 : 600,
              textDecoration: "none",
              whiteSpace: "nowrap",
              transition: "all 150ms ease",
              background: active ? "var(--green-dark)" : "rgba(10,42,10,0.12)",
              color: active ? "var(--green)" : "var(--green-dark)",
            }}>
            {tab.label}
            {locked && (
              <span style={{
                fontSize: 9, fontWeight: 800, padding: "1px 5px",
                borderRadius: 9999, background: "var(--green-dark)", color: "var(--green)",
                letterSpacing: ".04em",
              }}>PRO</span>
            )}
            {showBadge && (
              <span style={{
                position: "absolute", top: -4, right: -4,
                minWidth: 16, height: 16, padding: "0 4px",
                borderRadius: 9999, background: "#FF3D00", color: "#fff",
                fontSize: 9, fontWeight: 800,
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                {pendingBookings > 9 ? "9+" : pendingBookings}
              </span>
            )}
          </Link>
        );
      })}

      <a href={`/t/${slug}`} target="_blank" rel="noopener noreferrer"
        style={{
          marginLeft: "auto",
          display: "flex",
          alignItems: "center",
          gap: 5,
          padding: "6px 14px",
          borderRadius: 9999,
          fontSize: 13,
          fontWeight: 700,
          textDecoration: "none",
          background: "#fff",
          color: "var(--green-dark)",
          flexShrink: 0,
        }}>
        My page ↗
      </a>
    </nav>
  );
}
