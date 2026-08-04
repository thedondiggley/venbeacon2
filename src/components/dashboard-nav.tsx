"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  { href: "/dashboard", label: "Home", proOnly: false },
  { href: "/dashboard/schedule", label: "Schedule", proOnly: false },
  { href: "/dashboard/bookings", label: "Bookings", proOnly: true },
  { href: "/dashboard/venues", label: "Venues", proOnly: true },
  { href: "/dashboard/settings", label: "Settings", proOnly: false },
];

export function DashboardNav({ slug, isPro, pendingBookings }: {
  slug: string;
  isPro: boolean;
  pendingBookings: number;
}) {
  const pathname = usePathname();

  return (
    <nav className="flex items-center gap-0 overflow-x-auto">
      {TABS.map(tab => {
        const active = pathname === tab.href;
        const locked = tab.proOnly && !isPro;
        const showBadge = tab.href === "/dashboard/bookings" && pendingBookings > 0 && isPro;

        return (
          <Link key={tab.href} href={locked ? "/pricing" : tab.href}
            className="relative flex items-center gap-1.5 whitespace-nowrap px-4 py-3 text-sm transition border-b-2"
            style={{
              borderColor: active ? "var(--brand-green)" : "transparent",
              color: active ? "#fff" : "#888",
              fontWeight: active ? 600 : 400,
            }}>
            {tab.label}
            {locked && (
              <span className="text-xs rounded px-1.5 py-0.5 font-semibold"
                style={{ background: "var(--brand-green)", color: "var(--brand-green-darker)", fontSize: 10 }}>
                PRO
              </span>
            )}
            {showBadge && (
              <span className="absolute top-1.5 right-0.5 min-w-[16px] h-4 rounded-full flex items-center justify-center font-bold"
                style={{ background: "#FF3D00", color: "#fff", fontSize: 9, padding: "0 3px" }}>
                {pendingBookings > 9 ? "9+" : pendingBookings}
              </span>
            )}
          </Link>
        );
      })}
      <a href={`/t/${slug}`} target="_blank" rel="noopener noreferrer"
        className="ml-auto text-xs px-4 py-3 whitespace-nowrap font-medium"
        style={{ color: "var(--brand-green)" }}>
        View public page ↗
      </a>
    </nav>
  );
}
