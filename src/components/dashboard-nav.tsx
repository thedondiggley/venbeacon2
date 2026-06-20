"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  { href: "/dashboard", label: "Home", proOnly: false },
  { href: "/dashboard/schedule", label: "Schedule", proOnly: false },
  { href: "/dashboard/bookings", label: "Bookings", proOnly: true },
  { href: "/dashboard/venues", label: "Venue board", proOnly: true },
  { href: "/dashboard/settings", label: "Settings", proOnly: false },
];

export function DashboardNav({
  slug,
  isPro,
  pendingBookings,
}: {
  slug: string;
  isPro: boolean;
  pendingBookings: number;
}) {
  const pathname = usePathname();

  return (
    <div className="flex items-center justify-between border-b" style={{ borderColor: "var(--brand-line)" }}>
      <nav className="flex gap-0 overflow-x-auto">
        {TABS.map(tab => {
          const active = pathname === tab.href;
          const locked = tab.proOnly && !isPro;
          const showBadge = tab.href === "/dashboard/bookings" && pendingBookings > 0 && isPro;

          return (
            <Link
              key={tab.href}
              href={locked ? "/pricing" : tab.href}
              className="relative text-xs sm:text-sm py-3 px-3 border-b-2 transition flex items-center gap-1.5 whitespace-nowrap"
              style={{
                borderColor: active ? "var(--brand-green)" : "transparent",
                color: active ? "var(--brand-charcoal)" : "var(--brand-charcoal-soft)",
                fontWeight: active ? 500 : 400,
                opacity: locked ? 0.6 : 1,
              }}>
              {tab.label}
              {locked && (
                <span className="text-xs px-1 py-0.5 rounded font-medium"
                  style={{ background: "var(--brand-green-light)", color: "var(--brand-green-dark)", fontSize: "10px" }}>
                  PRO
                </span>
              )}
              {showBadge && (
                <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 rounded-full text-white flex items-center justify-center font-bold"
                  style={{ background: "#DC2626", fontSize: "9px", padding: "0 3px" }}>
                  {pendingBookings > 9 ? "9+" : pendingBookings}
                </span>
              )}
            </Link>
          );
        })}
      </nav>
      <a
        href={`/t/${slug}`}
        target="_blank"
        rel="noopener noreferrer"
        className="text-xs sm:text-sm py-3 pl-3 underline shrink-0"
        style={{ color: "var(--brand-green-dark)" }}>
        Public page ↗
      </a>
    </div>
  );
}
