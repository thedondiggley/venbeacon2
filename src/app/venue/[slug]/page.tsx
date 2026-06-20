import { createServiceClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { Logo } from "@/components/logo";
import { VenueContactReveal } from "@/components/venue-contact-reveal";
import type { Metadata } from "next";

type PageProps = { params: Promise<{ slug: string }> };

const VENUE_TYPE_LABELS: Record<string, string> = {
  brewery: "Brewery / taproom", apartment: "Apartment community", office: "Office park",
  shopping: "Shopping center", park: "Park / outdoor space", event_space: "Event space",
  church: "Church / place of worship", school: "School / university", private: "Private property", other: "Other",
};

const TRAFFIC_LABELS: Record<string, string> = {
  low: "Low (under 50/day)", medium: "Medium (50–200/day)", high: "High (200–500/day)", very_high: "Very high (500+/day)",
};

const FEE_LABELS: Record<string, string> = {
  none: "Free for vendors", negotiable: "Negotiable", flat: "Flat fee per day", percentage: "Percentage of sales",
};

async function getVenue(slug: string) {
  const supabase = createServiceClient();
  const { data } = await supabase.from("venue_listings").select("*").eq("slug", slug).eq("is_approved", true).single();
  return data;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const venue = await getVenue(slug);
  if (!venue) return { title: "Venue not found" };
  return {
    title: `${venue.venue_name} — VendorBeacon`,
    description: venue.description ?? `${venue.venue_name} is looking for food trucks in ${venue.city}.`,
  };
}

export default async function VenueDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const venue = await getVenue(slug);
  if (!venue) notFound();

  const typeLabel = VENUE_TYPE_LABELS[venue.venue_type] ?? venue.venue_type;

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-lg mx-auto px-4 py-8 pb-16">
        <div className="flex items-center justify-between mb-8">
          <a href="/dashboard/venues"><Logo variant="mark" size={32} /></a>
          <a href="/dashboard/venues" className="text-sm underline" style={{ color: "var(--brand-charcoal-soft)" }}>← Back to venue board</a>
        </div>

        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-3 flex-wrap mb-2">
            <h1 className="text-2xl font-semibold">{venue.venue_name}</h1>
            <span className="text-xs font-medium px-2.5 py-1 rounded-full"
              style={{ background: "var(--brand-green-light)", color: "var(--brand-green-dark)" }}>
              {typeLabel}
            </span>
          </div>
          <p className="text-sm" style={{ color: "var(--brand-charcoal-soft)" }}>
            📍 {venue.address}{venue.zip_code ? `, ${venue.zip_code}` : ""}, {venue.city}
          </p>
          {(venue.website_url || venue.instagram_url || venue.facebook_url) && (
            <div className="flex gap-3 mt-2 flex-wrap">
              {venue.website_url && <a href={venue.website_url} target="_blank" rel="noopener noreferrer" className="text-xs underline" style={{ color: "var(--brand-green-dark)" }}>Website</a>}
              {venue.instagram_url && <a href={venue.instagram_url} target="_blank" rel="noopener noreferrer" className="text-xs underline" style={{ color: "var(--brand-green-dark)" }}>Instagram</a>}
              {venue.facebook_url && <a href={venue.facebook_url} target="_blank" rel="noopener noreferrer" className="text-xs underline" style={{ color: "var(--brand-green-dark)" }}>Facebook</a>}
            </div>
          )}
        </div>

        {/* Key info cards */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          <div className="rounded-xl border p-3 text-center" style={{ borderColor: "var(--brand-line)" }}>
            <div className="text-xl mb-1">📅</div>
            <div className="text-xs font-medium mb-0.5" style={{ color: "var(--brand-charcoal-soft)" }}>Days</div>
            <div className="text-xs font-semibold">{venue.days_available}</div>
          </div>
          <div className="rounded-xl border p-3 text-center" style={{ borderColor: "var(--brand-line)" }}>
            <div className="text-xl mb-1">🕐</div>
            <div className="text-xs font-medium mb-0.5" style={{ color: "var(--brand-charcoal-soft)" }}>Hours</div>
            <div className="text-xs font-semibold">{venue.hours_available}</div>
          </div>
          <div className="rounded-xl border p-3 text-center" style={{ borderColor: "var(--brand-line)" }}>
            <div className="text-xl mb-1">🚚</div>
            <div className="text-xs font-medium mb-0.5" style={{ color: "var(--brand-charcoal-soft)" }}>Max trucks</div>
            <div className="text-xs font-semibold">{venue.max_trucks} {venue.max_trucks === 1 ? "truck" : "trucks"}</div>
          </div>
        </div>

        {/* Description */}
        {venue.description && (
          <div className="rounded-xl border p-4 mb-4" style={{ borderColor: "var(--brand-line)" }}>
            <h2 className="text-sm font-semibold mb-2">About this venue</h2>
            <p className="text-sm leading-relaxed whitespace-pre-line" style={{ color: "var(--brand-charcoal-soft)" }}>{venue.description}</p>
          </div>
        )}

        {/* Amenities */}
        <div className="rounded-xl border p-4 mb-4" style={{ borderColor: "var(--brand-line)" }}>
          <h2 className="text-sm font-semibold mb-3">Amenities & details</h2>
          <div className="grid grid-cols-2 gap-2">
            {[
              { label: "Electrical", val: venue.has_electrical },
              { label: "Water access", val: venue.has_water },
              { label: "Restrooms", val: venue.has_restrooms },
            ].map(item => (
              <div key={item.label} className="flex items-center gap-2">
                <span style={{ color: item.val ? "var(--brand-green)" : "#D3D1C7" }}>{item.val ? "✓" : "✗"}</span>
                <span className="text-xs">{item.label}</span>
              </div>
            ))}
            {venue.vendor_fee && (
              <div className="flex items-center gap-2 col-span-2">
                <span>💰</span>
                <span className="text-xs">Fee: {FEE_LABELS[venue.vendor_fee] ?? venue.vendor_fee}</span>
              </div>
            )}
            {venue.expected_traffic && (
              <div className="flex items-center gap-2 col-span-2">
                <span>👥</span>
                <span className="text-xs">Traffic: {TRAFFIC_LABELS[venue.expected_traffic] ?? venue.expected_traffic}</span>
              </div>
            )}
            {venue.requires_permit && (
              <div className="flex items-center gap-2 col-span-2">
                <span>📋</span>
                <span className="text-xs">Permits required</span>
              </div>
            )}
            {venue.requires_insurance && (
              <div className="flex items-center gap-2 col-span-2">
                <span>🛡️</span>
                <span className="text-xs">Insurance required</span>
              </div>
            )}
          </div>
        </div>

        {/* Parking details */}
        {venue.parking_details && (
          <div className="rounded-xl border p-4 mb-4" style={{ borderColor: "var(--brand-line)" }}>
            <h2 className="text-sm font-semibold mb-2">Parking & setup</h2>
            <p className="text-sm" style={{ color: "var(--brand-charcoal-soft)" }}>{venue.parking_details}</p>
          </div>
        )}

        {/* Contact */}
        <div className="rounded-xl border p-4" style={{ borderColor: "var(--brand-line)" }}>
          <h2 className="text-sm font-semibold mb-1">Contact this venue</h2>
          <p className="text-sm mb-4" style={{ color: "var(--brand-charcoal-soft)" }}>
            Reach out directly to discuss availability and set up a time to park.
          </p>
          <VenueContactReveal venueId={venue.id} />
        </div>

        <p className="text-xs text-center mt-8" style={{ color: "var(--brand-charcoal-soft)" }}>
          Powered by <a href="https://vendorbeacon.app" style={{ color: "var(--brand-green-dark)" }}>VendorBeacon</a> ·{" "}
          <a href="/terms" style={{ color: "var(--brand-charcoal-soft)" }}>Terms</a> ·{" "}
          <a href="/privacy" style={{ color: "var(--brand-charcoal-soft)" }}>Privacy</a>
        </p>
      </div>
    </div>
  );
}
