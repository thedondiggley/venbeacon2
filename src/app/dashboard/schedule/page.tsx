import { getCurrentVendor } from "@/lib/vendor";
import { createClient } from "@/lib/supabase/server";
import { ScheduleManager, Location } from "@/components/schedule-manager";

export default async function SchedulePage() {
  const vendor = await getCurrentVendor();
  const supabase = await createClient();

  const { data: locations } = await supabase
    .from("locations")
    .select("*")
    .eq("vendor_id", vendor.id)
    .gte("start_time", new Date().toISOString().slice(0, 10))
    .order("start_time", { ascending: true });

  const activeCount = locations?.length ?? 0;

  return (
    <div>
      {!vendor.is_pro && (
        <div className="rounded-lg border p-4 mb-6 flex items-center justify-between gap-4"
          style={{ borderColor: "var(--brand-line)", background: "#fafaf8" }}>
          <div>
            <p className="text-sm font-medium" style={{ color: "var(--brand-charcoal)" }}>
              Free plan — {activeCount}/3 active stops used
            </p>
            <p className="text-sm mt-0.5" style={{ color: "var(--brand-charcoal-soft)" }}>
              Upgrade to Pro for unlimited stops, the venue board, and booking requests.
            </p>
          </div>
          <a href="/pricing"
            className="shrink-0 rounded-lg px-3 py-1.5 text-sm font-medium text-white"
            style={{ background: "var(--brand-green)" }}>
            Upgrade
          </a>
        </div>
      )}

      <div className="mb-6">
        <h1 className="text-lg font-medium">Your schedule</h1>
        <p className="text-sm mt-1" style={{ color: "var(--brand-charcoal-soft)" }}>
          Add where you'll be. Updates your public page at{" "}
          <span className="font-medium">vendorbeacon.app/t/{vendor.slug}</span> instantly.
        </p>
      </div>

      <ScheduleManager
        vendorId={vendor.id}
        isPro={vendor.is_pro}
        activeCount={activeCount}
        initialLocations={(locations as Location[]) ?? []}
      />
    </div>
  );
}
