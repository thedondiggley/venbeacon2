import { getCurrentVendor } from "@/lib/vendor";
import { createServiceClient } from "@/lib/supabase/server";
import { VenueBoard, VenueListing } from "@/components/venue-board";

export default async function VenuesPage() {
  const vendor = await getCurrentVendor();
  const supabase = createServiceClient();

  const { count } = await supabase
    .from("venue_listings")
    .select("id", { count: "exact", head: true })
    .eq("is_approved", true);

  if (!vendor.is_pro) {
    return (
      <div>
        <div className="mb-6">
          <h1 className="text-lg font-medium">Venue board</h1>
          <p className="text-sm mt-1" style={{ color: "var(--brand-charcoal-soft)" }}>
            Venues looking for food trucks in your area.
          </p>
        </div>
        <div className="rounded-xl border p-6 mb-6 text-center"
          style={{ background: "var(--brand-green-light)", borderColor: "#a8cf72" }}>
          <div className="text-3xl font-bold mb-1" style={{ color: "var(--brand-green-dark)" }}>
            {count ?? 0}
          </div>
          <div className="text-base font-medium mb-1" style={{ color: "var(--brand-green-dark)" }}>
            active venue opportunities available
          </div>
          <p className="text-sm mb-4" style={{ color: "var(--brand-green-dark)", opacity: 0.8 }}>
            Upgrade to Pro to see venue details, available spots, and contact info.
          </p>
          <a href="/pricing"
            className="inline-block rounded-lg px-5 py-2.5 text-sm font-semibold text-white"
            style={{ background: "var(--brand-green)" }}>
            Unlock venue opportunities
          </a>
        </div>
        <VenueBoard initialListings={[]} isPro={false} previewCount={count ?? 0} />
      </div>
    );
  }

  const { data: listings } = await supabase
    .from("venue_listings")
    .select("id, venue_name, venue_type, city, slug, days_available, hours_available, description, max_trucks, created_at")
    .eq("is_approved", true)
    .order("created_at", { ascending: false });

  return (
    <div>
      <div className="flex items-start justify-between mb-5">
        <div>
          <h1 className="text-lg font-medium">Venue board</h1>
          <p className="text-sm mt-1" style={{ color: "var(--brand-charcoal-soft)" }}>
            Venues actively looking for food trucks. Click any venue to see full details and contact info.
          </p>
        </div>
        <a href="/list-your-venue" target="_blank" rel="noopener noreferrer"
          className="text-xs shrink-0 underline mt-1"
          style={{ color: "var(--brand-charcoal-soft)" }}>
          Know a venue? List it →
        </a>
      </div>
      <VenueBoard initialListings={(listings ?? []) as VenueListing[]} isPro={true} previewCount={0} />
    </div>
  );
}
