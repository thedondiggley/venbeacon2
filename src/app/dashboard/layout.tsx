import { getCurrentVendor } from "@/lib/vendor";
import { createClient } from "@/lib/supabase/server";
import { DashboardNav } from "@/components/dashboard-nav";
import { LogoutButton } from "@/components/logout-button";
import Link from "next/link";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const vendor = await getCurrentVendor();
  const supabase = await createClient();

  let pendingBookings = 0;
  if (vendor.is_pro) {
    const { count } = await supabase
      .from("bookings")
      .select("id", { count: "exact", head: true })
      .eq("vendor_id", vendor.id)
      .eq("status", "pending");
    pendingBookings = count ?? 0;
  }

  return (
    <div className="min-h-screen" style={{ background: "var(--brand-surface)" }}>
      {/* Top nav — dark */}
      <header style={{ background: "var(--brand-dark)", borderBottom: "1px solid var(--brand-line-dark)" }}>
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link href="/dashboard" className="flex items-center gap-2">
            <div className="flex items-center justify-center rounded-lg" style={{ width: 28, height: 28, background: "var(--brand-green)" }}>
              <span style={{ color: "var(--brand-green-darker)", fontWeight: 700, fontSize: 14 }}>V</span>
            </div>
            <span style={{ color: "#fff", fontWeight: 600, fontSize: 15 }}>VendorBeacon</span>
          </Link>

          <div className="flex items-center gap-3">
            {vendor.is_pro ? (
              <span className="text-xs font-semibold px-2 py-1 rounded-full" style={{ background: "var(--brand-green)", color: "var(--brand-green-darker)" }}>
                Pro
              </span>
            ) : (
              <Link href="/pricing" className="text-xs font-semibold px-3 py-1.5 rounded-lg" style={{ background: "var(--brand-green)", color: "var(--brand-green-darker)" }}>
                Upgrade to Pro
              </Link>
            )}
            <span className="text-sm hidden sm:block" style={{ color: "#888" }}>
              {vendor.business_name}
            </span>
            <LogoutButton />
          </div>
        </div>

        {/* Tab nav */}
        <div className="max-w-5xl mx-auto px-4">
          <DashboardNav slug={vendor.slug} isPro={vendor.is_pro} pendingBookings={pendingBookings} />
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-4 py-6">
        <main>{children}</main>
      </div>
    </div>
  );
}
