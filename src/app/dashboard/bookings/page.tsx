import { getCurrentVendor } from "@/lib/vendor";
import { createClient } from "@/lib/supabase/server";
import { BookingsList, Booking } from "@/components/bookings-list";

export default async function BookingsPage() {
  const vendor = await getCurrentVendor();

  if (!vendor.is_pro) {
    return (
      <div>
        <div className="mb-6">
          <h1 className="text-lg font-medium">Booking requests</h1>
        </div>
        <div className="rounded-xl border p-8 text-center"
          style={{ background: "var(--brand-green-light)", borderColor: "#a8cf72" }}>
          <div className="text-2xl mb-3">📥</div>
          <h2 className="text-base font-semibold mb-2" style={{ color: "var(--brand-green-dark)" }}>
            Booking requests are a Pro feature
          </h2>
          <p className="text-sm mb-4 max-w-sm mx-auto"
            style={{ color: "var(--brand-green-dark)", opacity: 0.85 }}>
            Upgrade to Pro to receive booking requests from venues, approve or decline them,
            and have approved bookings auto-added to your schedule.
          </p>
          <a href="/pricing"
            className="inline-block rounded-lg px-5 py-2.5 text-sm font-semibold text-white"
            style={{ background: "var(--brand-green)" }}>
            Start booking new locations
          </a>
        </div>
      </div>
    );
  }

  const supabase = await createClient();
  const { data: bookings } = await supabase
    .from("bookings")
    .select("*")
    .eq("vendor_id", vendor.id)
    .order("created_at", { ascending: false });

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-lg font-medium">Booking requests</h1>
        <p className="text-sm mt-1" style={{ color: "var(--brand-charcoal-soft)" }}>
          Venues request you through your public page. Approving auto-adds it to your schedule.
        </p>
      </div>
      <BookingsList
        vendorId={vendor.id}
        initialBookings={(bookings ?? []) as Booking[]}
      />
    </div>
  );
}
