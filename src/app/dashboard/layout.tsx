import { getCurrentVendor } from "@/lib/vendor";
import { createClient } from "@/lib/supabase/server";
import { Logo } from "@/components/logo";
import { DashboardNav } from "@/components/dashboard-nav";
import { LogoutButton } from "@/components/logout-button";
import { ProBadge } from "@/components/pro-badge";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const vendor = await getCurrentVendor();
  const supabase = await createClient();

  // Get pending booking count for notification badge
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
    <div className="min-h-screen bg-white">
      <header className="border-b" style={{ borderColor: "var(--brand-line)" }}>
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <Logo variant="full" size={32} />
          <div className="flex items-center gap-3">
            <ProBadge isPro={vendor.is_pro} />
            <span className="text-sm hidden sm:block" style={{ color: "var(--brand-charcoal-soft)" }}>
              {vendor.business_name}
            </span>
            <LogoutButton />
          </div>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-4 py-6">
        <DashboardNav
          slug={vendor.slug}
          isPro={vendor.is_pro}
          pendingBookings={pendingBookings}
        />
        <main className="mt-6">{children}</main>
      </div>
    </div>
  );
}
