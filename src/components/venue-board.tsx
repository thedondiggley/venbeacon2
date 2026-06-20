"use client";

import { useState } from "react";
import Link from "next/link";

const VENUE_TYPE_LABELS: Record<string, string> = {
  brewery: "Brewery", apartment: "Apartment", office: "Office park",
  shopping: "Shopping", park: "Park", event_space: "Event space",
  church: "Church", school: "School", private: "Private", other: "Other",
};

const FILTER_OPTIONS = [
  { value: "all", label: "All types" },
  { value: "brewery", label: "Brewery" },
  { value: "apartment", label: "Apartment" },
  { value: "office", label: "Office park" },
  { value: "shopping", label: "Shopping" },
  { value: "park", label: "Park" },
  { value: "event_space", label: "Event space" },
  { value: "church", label: "Church" },
  { value: "school", label: "School" },
  { value: "other", label: "Other" },
];

export type VenueListing = {
  id: string;
  venue_name: string;
  venue_type: string;
  city: string;
  slug: string;
  days_available: string;
  hours_available: string;
  description: string | null;
  max_trucks: number;
  has_electrical: boolean;
  has_water: boolean;
  has_restrooms: boolean;
  vendor_fee: string | null;
  requires_permit: boolean;
  requires_insurance: boolean;
  expected_traffic: string | null;
  created_at: string;
};

function timeAgo(iso: string) {
  const days = Math.floor((Date.now() - new Date(iso).getTime()) / 86400000);
  if (days === 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days}d ago`;
  if (days < 30) return `${Math.floor(days / 7)}w ago`;
  return `${Math.floor(days / 30)}mo ago`;
}

const PREVIEW_ITEMS = [
  { type: "brewery", city: "Chattanooga" },
  { type: "apartment", city: "Chattanooga" },
  { type: "office", city: "Chattanooga" },
  { type: "park", city: "Chattanooga" },
  { type: "event_space", city: "Chattanooga" },
];

export function VenueBoard({ initialListings, isPro, previewCount }: {
  initialListings: VenueListing[];
  isPro: boolean;
  previewCount: number;
}) {
  const [filter, setFilter] = useState("all");
  const [citySearch, setCitySearch] = useState("");
  const [electricalOnly, setElectricalOnly] = useState(false);
  const [freeOnly, setFreeOnly] = useState(false);

  const filtered = initialListings.filter(l => {
    if (filter !== "all" && l.venue_type !== filter) return false;
    if (citySearch && !l.city.toLowerCase().includes(citySearch.toLowerCase())) return false;
    if (electricalOnly && !l.has_electrical) return false;
    if (freeOnly && l.vendor_fee !== "none" && l.vendor_fee !== null && l.vendor_fee !== "") return false;
    return true;
  });

  if (!isPro) {
    return (
      <div>
        <p className="text-xs mb-4" style={{ color: "var(--brand-charcoal-soft)" }}>Upgrade to Pro to see venue details and contact info</p>
        <div className="space-y-2">
          {PREVIEW_ITEMS.slice(0, Math.min(previewCount, 5)).map((v, i) => (
            <div key={i} className="rounded-lg border relative overflow-hidden" style={{ borderColor: "var(--brand-line)" }}>
              <div className="flex items-center justify-between px-4 py-3 filter blur-sm select-none pointer-events-none">
                <div>
                  <div className="text-sm font-medium">████████████████</div>
                  <div className="text-xs mt-0.5" style={{ color: "var(--brand-charcoal-soft)" }}>{v.city} · {VENUE_TYPE_LABELS[v.type]}</div>
                </div>
                <div className="text-xs px-2 py-0.5 rounded-full" style={{ background: "var(--brand-green-light)", color: "var(--brand-green-dark)" }}>🚚 2 spots</div>
              </div>
              <div className="absolute inset-0 flex items-center justify-center bg-white/60">
                <a href="/pricing" className="rounded-lg px-3 py-1.5 text-xs font-semibold text-white" style={{ background: "var(--brand-green)" }}>Upgrade to unlock</a>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (initialListings.length === 0) {
    return (
      <div className="rounded-lg border p-6 text-center" style={{ borderColor: "var(--brand-line)" }}>
        <p className="text-sm font-medium">No venues listed yet.</p>
        <p className="text-sm mt-1" style={{ color: "var(--brand-charcoal-soft)" }}>Share the listing link with local breweries, apartment complexes, and office parks.</p>
        <a href="/list-your-venue" target="_blank" rel="noopener noreferrer" className="inline-block mt-4 text-sm font-medium underline" style={{ color: "var(--brand-green-dark)" }}>List a venue</a>
      </div>
    );
  }

  return (
    <div>
      {/* Search */}
      <div className="mb-4">
        <input type="text" value={citySearch} onChange={e => setCitySearch(e.target.value)}
          placeholder="Search by city..."
          className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2"
          style={{ borderColor: "var(--brand-line)" }} />
      </div>

      {/* Type filters */}
      <div className="flex gap-2 flex-wrap mb-3">
        {FILTER_OPTIONS.map(opt => (
          <button key={opt.value} onClick={() => setFilter(opt.value)}
            className="rounded-full px-3 py-1 text-xs font-medium border transition"
            style={{ background: filter === opt.value ? "var(--brand-green)" : "#fff", color: filter === opt.value ? "#fff" : "var(--brand-charcoal-soft)", borderColor: filter === opt.value ? "var(--brand-green)" : "var(--brand-line)" }}>
            {opt.label}
          </button>
        ))}
      </div>

      {/* Amenity filters */}
      <div className="flex gap-3 mb-4 flex-wrap">
        <button onClick={() => setElectricalOnly(!electricalOnly)}
          className="flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium border transition"
          style={{ background: electricalOnly ? "#FEF9C3" : "#fff", color: electricalOnly ? "#854D0E" : "var(--brand-charcoal-soft)", borderColor: electricalOnly ? "#FDE68A" : "var(--brand-line)" }}>
          ⚡ Has electrical
        </button>
        <button onClick={() => setFreeOnly(!freeOnly)}
          className="flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium border transition"
          style={{ background: freeOnly ? "var(--brand-green-light)" : "#fff", color: freeOnly ? "var(--brand-green-dark)" : "var(--brand-charcoal-soft)", borderColor: freeOnly ? "#a8cf72" : "var(--brand-line)" }}>
          💚 Free for vendors
        </button>
      </div>

      <p className="text-xs mb-3" style={{ color: "var(--brand-charcoal-soft)" }}>
        {filtered.length} {filtered.length === 1 ? "venue" : "venues"} listed
        {filtered.length === 0 && initialListings.length > 0 && " — try adjusting your filters"}
      </p>

      <div className="border rounded-xl overflow-hidden" style={{ borderColor: "var(--brand-line)" }}>
        {filtered.length === 0 ? (
          <div className="px-4 py-8 text-center">
            <p className="text-sm" style={{ color: "var(--brand-charcoal-soft)" }}>No venues match your filters.</p>
            <button onClick={() => { setFilter("all"); setCitySearch(""); setElectricalOnly(false); setFreeOnly(false); }}
              className="text-sm underline mt-2 block mx-auto" style={{ color: "var(--brand-green-dark)" }}>
              Clear all filters
            </button>
          </div>
        ) : (
          filtered.map((listing, i) => (
            <Link key={listing.id} href={`/venue/${listing.slug}`}
              className="flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition"
              style={{ borderBottom: i < filtered.length - 1 ? "1px solid var(--brand-line)" : "none", textDecoration: "none", display: "flex" }}>
              <div className="min-w-0">
                <div className="text-sm font-medium truncate" style={{ color: "var(--brand-charcoal)" }}>{listing.venue_name}</div>
                <div className="text-xs mt-0.5 flex items-center gap-1.5 flex-wrap" style={{ color: "var(--brand-charcoal-soft)" }}>
                  <span>📍 {listing.city}</span>
                  <span>·</span>
                  <span className="px-1.5 py-0.5 rounded-full" style={{ background: "var(--brand-green-light)", color: "var(--brand-green-dark)", fontSize: "10px" }}>
                    {VENUE_TYPE_LABELS[listing.venue_type] ?? listing.venue_type}
                  </span>
                  {listing.has_electrical && <span title="Has electrical">⚡</span>}
                  {listing.vendor_fee === "none" && <span className="text-xs" style={{ color: "var(--brand-green-dark)" }}>Free</span>}
                </div>
              </div>
              <div className="flex items-center gap-3 shrink-0 ml-3">
                <div className="text-right">
                  <div className="text-xs font-medium" style={{ color: "var(--brand-green-dark)" }}>🚚 {listing.max_trucks} {listing.max_trucks === 1 ? "spot" : "spots"}</div>
                  <div className="text-xs mt-0.5" style={{ color: "var(--brand-charcoal-soft)" }}>{timeAgo(listing.created_at)}</div>
                </div>
                <span style={{ color: "var(--brand-charcoal-soft)", fontSize: "16px" }}>›</span>
              </div>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}
