import { createServiceClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { Logo } from "@/components/logo";
import { BookingForm } from "@/components/booking-form";
import type { Metadata } from "next";

type PageProps = {
  params: Promise<{ slug: string }>;
};

async function getVendorData(slug: string) {
  const supabase = createServiceClient();

  const { data: vendor } = await supabase
    .from("vendors")
    .select("id, business_name, description, contact_phone, instagram_url, facebook_url, tiktok_url, slug, is_pro, logo_url")
    .eq("slug", slug)
    .single();

  if (!vendor) return null;

  const { data: locations } = await supabase
    .from("locations")
    .select("*")
    .eq("vendor_id", vendor.id)
    .gte("end_time", new Date().toISOString())
    .order("start_time", { ascending: true })
    .limit(20);

  return { vendor, locations: locations ?? [] };
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const data = await getVendorData(slug);

  if (!data) return { title: "Not found" };

  return {
    title: `${data.vendor.business_name} - schedule`,
    description: data.vendor.description ?? `See where ${data.vendor.business_name} is parked this week.`,
  };
}

function formatDay(iso: string) {
  const d = new Date(iso);
  const today = new Date();
  const isToday = d.toDateString() === today.toDateString();

  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const isTomorrow = d.toDateString() === tomorrow.toDateString();

  if (isToday) return "Today";
  if (isTomorrow) return "Tomorrow";

  return d.toLocaleDateString(undefined, { weekday: "long", month: "short", day: "numeric" });
}

function formatTimeRange(startIso: string, endIso: string) {
  const start = new Date(startIso);
  const end = new Date(endIso);
  const fmt = (d: Date) =>
    d.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
  return `${fmt(start)} - ${fmt(end)}`;
}

export default async function VendorPage({ params }: PageProps) {
  const { slug } = await params;
  const data = await getVendorData(slug);

  if (!data) notFound();

  const { vendor, locations } = data;
  const today = new Date();
  const todayLocation = locations.find(
    (l) => new Date(l.start_time).toDateString() === today.toDateString()
  );
  const upcoming = locations.filter((l) => l !== todayLocation);

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-md mx-auto px-4 py-8">
        <header className="mb-6">
          {vendor.logo_url && (
            <div className="mb-4">
              <img
                src={vendor.logo_url}
                alt={`${vendor.business_name} logo`}
                className="w-20 h-20 rounded-xl object-cover border"
                style={{ borderColor: "var(--brand-line)" }}
              />
            </div>
          )}
          <h1 className="text-2xl font-medium mt-3">{vendor.business_name}</h1>
          {vendor.description && (
            <p className="text-sm mt-1" style={{ color: "var(--brand-charcoal-soft)" }}>
              {vendor.description}
            </p>
          )}

          {(vendor.instagram_url || vendor.facebook_url || vendor.tiktok_url || vendor.contact_phone) && (
            <div className="flex gap-4 mt-3 text-sm flex-wrap">
              {vendor.instagram_url && (
                <a href={vendor.instagram_url} target="_blank" rel="noopener noreferrer" className="underline" style={{ color: "var(--brand-green-dark)" }}>Instagram</a>
              )}
              {vendor.facebook_url && (
                <a href={vendor.facebook_url} target="_blank" rel="noopener noreferrer" className="underline" style={{ color: "var(--brand-green-dark)" }}>Facebook</a>
              )}
              {vendor.tiktok_url && (
                <a href={vendor.tiktok_url} target="_blank" rel="noopener noreferrer" className="underline" style={{ color: "var(--brand-green-dark)" }}>TikTok</a>
              )}
              {vendor.contact_phone && (
                <a href={`tel:${vendor.contact_phone}`} className="underline" style={{ color: "var(--brand-green-dark)" }}>{vendor.contact_phone}</a>
              )}
            </div>
          )}
        </header>

        {/* Today - prominent */}
        {todayLocation ? (
          <div
            className="rounded-xl p-4 mb-6"
            style={{ background: "var(--brand-green)" }}
          >
            <p className="text-xs font-medium uppercase tracking-wide text-white opacity-80">
              Today
            </p>
            <p className="text-lg font-medium text-white mt-1">{todayLocation.title}</p>
            <p className="text-sm text-white opacity-90 mt-0.5">
              {formatTimeRange(todayLocation.start_time, todayLocation.end_time)}
            </p>
            {todayLocation.address && (
              <p className="text-sm text-white opacity-90 mt-0.5">{todayLocation.address}</p>
            )}
            {todayLocation.notes && (
              <p className="text-sm text-white opacity-90 mt-1">{todayLocation.notes}</p>
            )}
          </div>
        ) : (
          <div
            className="rounded-xl p-4 mb-6 border"
            style={{ borderColor: "var(--brand-line)" }}
          >
            <p className="text-sm" style={{ color: "var(--brand-charcoal-soft)" }}>
              Not out today - check the schedule below for our next stop.
            </p>
          </div>
        )}

        {/* Upcoming */}
        {upcoming.length > 0 && (
          <div className="mb-8">
            <h2 className="text-sm font-medium mb-3">Coming up</h2>
            <ul className="space-y-2">
              {upcoming.map((loc) => (
                <li
                  key={loc.id}
                  className="rounded-lg border p-3"
                  style={{ borderColor: "var(--brand-line)" }}
                >
                  <p className="text-xs font-medium" style={{ color: "var(--brand-green-dark)" }}>
                    {formatDay(loc.start_time)}
                  </p>
                  <p className="text-sm font-medium mt-0.5">{loc.title}</p>
                  <p className="text-sm" style={{ color: "var(--brand-charcoal-soft)" }}>
                    {formatTimeRange(loc.start_time, loc.end_time)}
                  </p>
                  {loc.address && (
                    <p className="text-sm" style={{ color: "var(--brand-charcoal-soft)" }}>
                      {loc.address}
                    </p>
                  )}
                </li>
              ))}
            </ul>
          </div>
        )}

        {locations.length === 0 && (
          <p className="text-sm mb-8" style={{ color: "var(--brand-charcoal-soft)" }}>
            No upcoming stops scheduled right now. Check back soon.
          </p>
        )}

        {/* Booking request */}
        <div className="border-t pt-6" style={{ borderColor: "var(--brand-line)" }}>
          {vendor.is_pro ? (
            <>
              <h2 className="text-sm font-medium mb-1">Book us for your event</h2>
              <p className="text-sm mb-4" style={{ color: "var(--brand-charcoal-soft)" }}>
                Run a brewery, office, apartment community, or event? Request a date below.
              </p>
              <BookingForm vendorId={vendor.id} />
            </>
          ) : (
            <p className="text-sm" style={{ color: "var(--brand-charcoal-soft)" }}>
              This vendor is not currently accepting bookings through VendorBeacon.
            </p>
          )}
        </div>

        <footer className="mt-12 text-center">
          <p className="text-xs" style={{ color: "var(--brand-charcoal-soft)" }}>
            Powered by VendorBeacon
          </p>
        </footer>
      </div>
    </div>
  );
}
