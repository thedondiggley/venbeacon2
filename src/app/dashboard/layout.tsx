import { getCurrentVendor } from "@/lib/vendor";
import { createClient } from "@/lib/supabase/server";
import { DashboardNav } from "@/components/dashboard-nav";
import { LogoutButton } from "@/components/logout-button";
import { ToastProvider } from "@/components/ui";
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
    <ToastProvider>
      <div style={{ minHeight: "100vh", background: "var(--bg)" }}>
        <header style={{ background: "var(--green)", position: "sticky", top: 0, zIndex: 100 }}>
          <div style={{ maxWidth: 960, margin: "0 auto", padding: "0 16px" }}>
            {/* Top row */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", height: 56 }}>
              <Link href="/dashboard" style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none" }}>
                <div style={{ width: 30, height: 30, background: "var(--green-dark)", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <span style={{ color: "var(--green)", fontWeight: 800, fontSize: 15 }}>V</span>
                </div>
                <span style={{ fontWeight: 800, fontSize: 17, color: "var(--green-dark)", letterSpacing: "-0.02em" }}>VendorBeacon</span>
              </Link>

              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                {vendor.is_pro ? (
                  <Link href="/dashboard/settings" style={{
                    background: "var(--green-dark)", color: "var(--green)",
                    fontSize: 11, fontWeight: 800, padding: "4px 12px",
                    borderRadius: 9999, textDecoration: "none", letterSpacing: ".04em",
                  }}>PRO</Link>
                ) : (
                  <Link href="/pricing" style={{
                    background: "var(--green-dark)", color: "var(--green)",
                    fontSize: 12, fontWeight: 700, padding: "6px 14px",
                    borderRadius: 9999, textDecoration: "none",
                  }}>Upgrade to Pro</Link>
                )}
                <span style={{ fontSize: 13, fontWeight: 600, color: "var(--green-dark)" }} className="hidden sm:block">
                  {vendor.business_name}
                </span>
                <LogoutButton />
              </div>
            </div>

            {/* Nav pills */}
            <div style={{ paddingBottom: 12 }}>
              <DashboardNav slug={vendor.slug} isPro={vendor.is_pro} pendingBookings={pendingBookings} />
            </div>
          </div>
        </header>

        <main style={{ maxWidth: 960, margin: "0 auto", padding: "24px 16px 80px" }}>
          {children}
        </main>
      </div>
    </ToastProvider>
  );
}
