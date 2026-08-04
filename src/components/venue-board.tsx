"use client";

import { useState } from "react";
import Link from "next/link";
import { Card, Badge, PageHeader, Input, Button } from "@/components/ui";

const TYPE_LABELS: Record<string, string> = {
  brewery: "Brewery", apartment: "Apartment", office: "Office park",
  shopping: "Shopping center", park: "Park", public_space: "Public space",
  farmers_market: "Farmers market", event_space: "Event space",
  church: "Church", school: "School", private: "Private", other: "Other",
};
const TYPE_EMOJI: Record<string, string> = {
  brewery: "🍺", apartment: "🏢", office: "💼", shopping: "🛍️",
  park: "🌳", public_space: "📍", farmers_market: "🌽", event_space: "🎪",
  church: "⛪", school: "🎓", private: "🏠", other: "📌",
};

export type VenueListing = {
  id: string; venue_name: string; venue_type: string; city: string; slug: string;
  days_available: string; hours_available: string; description: string | null;
  max_trucks: number; has_electrical: boolean; has_water: boolean; has_restrooms: boolean;
  vendor_fee: string | null; requires_permit: boolean; requires_insurance: boolean;
  expected_traffic: string | null;
};

export function VenueBoard({ listings, isPro }: { listings: VenueListing[]; isPro: boolean }) {
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [electricalOnly, setElectricalOnly] = useState(false);
  const [freeOnly, setFreeOnly] = useState(false);

  const filtered = listings.filter(v => {
    if (search && !v.venue_name.toLowerCase().includes(search.toLowerCase()) && !v.city.toLowerCase().includes(search.toLowerCase())) return false;
    if (typeFilter !== "all" && v.venue_type !== typeFilter) return false;
    if (electricalOnly && !v.has_electrical) return false;
    if (freeOnly && v.vendor_fee) return false;
    return true;
  });

  const allTypes = Array.from(new Set(listings.map(v => v.venue_type)));

  if (!isPro) {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 20 }} className="animate-fade-in">
        <PageHeader title="Venue board" description="Browse venues actively looking for food trucks" />
        <Card variant="dark" padding="lg">
          <div style={{ textAlign: "center", padding: "24px 0" }}>
            <p style={{ fontSize: 48, marginBottom: 16 }}>🔒</p>
            <p style={{ fontSize: 20, fontWeight: 700, color: "#fff", marginBottom: 8, letterSpacing: "-0.02em" }}>
              {listings.length} venue{listings.length !== 1 ? "s" : ""} on the board
            </p>
            <p style={{ fontSize: 14, color: "var(--text-on-dark-3)", maxWidth: 360, margin: "0 auto 24px", lineHeight: 1.6 }}>
              Upgrade to Pro to browse local breweries, apartments, office parks, and event spaces actively looking for food trucks. Contact them directly.
            </p>
            <Link href="/pricing" style={{ display: "inline-block", background: "var(--green)", color: "var(--green-dark)", fontSize: 14, fontWeight: 700, padding: "12px 28px", borderRadius: 9999, textDecoration: "none" }}>
              Upgrade to Pro — from $14.99/month
            </Link>
            <p style={{ fontSize: 12, color: "var(--text-on-dark-3)", marginTop: 12 }}>
              Cancel anytime · Founding offer available
            </p>
          </div>
          {/* Blurred preview */}
          <div style={{ marginTop: 24, position: "relative" }}>
            <div style={{ filter: "blur(6px)", pointerEvents: "none", display: "flex", flexDirection: "column", gap: 10 }}>
              {listings.slice(0, 3).map(v => (
                <div key={v.id} style={{ padding: "16px", background: "var(--dark-3)", borderRadius: "var(--r-md)", border: "1px solid var(--border-dark)" }}>
                  <p style={{ fontSize: 15, fontWeight: 700, color: "#fff" }}>{v.venue_name}</p>
                  <p style={{ fontSize: 13, color: "var(--text-on-dark-3)", marginTop: 4 }}>{v.city} · {TYPE_LABELS[v.venue_type] || v.venue_type}</p>
                </div>
              ))}
            </div>
            <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Link href="/pricing" style={{ background: "var(--green)", color: "var(--green-dark)", fontSize: 13, fontWeight: 700, padding: "10px 22px", borderRadius: 9999, textDecoration: "none" }}>
                Unlock full board →
              </Link>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }} className="animate-fade-in">
      <PageHeader title="Venue board" description={`${listings.length} venue${listings.length !== 1 ? "s" : ""} looking for food trucks`} />

      {/* Filters */}
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        <input
          type="text" value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Search venues or cities..."
          style={{ height: 44, padding: "0 16px", fontSize: 14, background: "var(--surface)", border: "1px solid var(--border-2)", borderRadius: "var(--r-md)", outline: "none", width: "100%", color: "var(--text)" }}
        />
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {[{ value: "all", label: "All types" }, ...allTypes.map(t => ({ value: t, label: `${TYPE_EMOJI[t] || ""} ${TYPE_LABELS[t] || t}` }))].map(f => (
            <button key={f.value} onClick={() => setTypeFilter(f.value)} style={{
              padding: "6px 14px", borderRadius: 9999, fontSize: 13, fontWeight: 600, cursor: "pointer",
              background: typeFilter === f.value ? "var(--green)" : "var(--surface)",
              color: typeFilter === f.value ? "var(--green-dark)" : "var(--text-3)",
              border: `1px solid ${typeFilter === f.value ? "var(--green-border)" : "var(--border)"}`,
            }}>{f.label}</button>
          ))}
          <button onClick={() => setElectricalOnly(!electricalOnly)} style={{
            padding: "6px 14px", borderRadius: 9999, fontSize: 13, fontWeight: 600, cursor: "pointer",
            background: electricalOnly ? "var(--green)" : "var(--surface)",
            color: electricalOnly ? "var(--green-dark)" : "var(--text-3)",
            border: `1px solid ${electricalOnly ? "var(--green-border)" : "var(--border)"}`,
          }}>⚡ Electrical</button>
          <button onClick={() => setFreeOnly(!freeOnly)} style={{
            padding: "6px 14px", borderRadius: 9999, fontSize: 13, fontWeight: 600, cursor: "pointer",
            background: freeOnly ? "var(--green)" : "var(--surface)",
            color: freeOnly ? "var(--green-dark)" : "var(--text-3)",
            border: `1px solid ${freeOnly ? "var(--green-border)" : "var(--border)"}`,
          }}>Free for vendors</button>
        </div>
      </div>

      {filtered.length === 0 ? (
        <Card padding="lg">
          <div style={{ textAlign: "center", padding: "32px 0" }}>
            <p style={{ fontSize: 36, marginBottom: 12 }}>🔍</p>
            <p style={{ fontSize: 16, fontWeight: 700, color: "var(--text)", marginBottom: 6 }}>No venues match your filters</p>
            <button onClick={() => { setSearch(""); setTypeFilter("all"); setElectricalOnly(false); setFreeOnly(false); }}
              style={{ fontSize: 14, fontWeight: 700, color: "var(--green-mid)", background: "none", border: "none", cursor: "pointer", marginTop: 8 }}>
              Clear filters
            </button>
          </div>
        </Card>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {filtered.map(v => (
            <Link key={v.id} href={`/venue/${v.slug}`} style={{ textDecoration: "none" }}>
              <div style={{
                display: "flex", gap: 16, padding: "18px 20px",
                background: "var(--surface)", borderRadius: "var(--r-lg)",
                border: "1px solid var(--border)", boxShadow: "var(--shadow-sm)",
                transition: "all var(--t)", cursor: "pointer",
              }}
                onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.borderColor = "var(--green-border)"; (e.currentTarget as HTMLDivElement).style.boxShadow = "var(--shadow-md)"; (e.currentTarget as HTMLDivElement).style.transform = "translateY(-1px)"; }}
                onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.borderColor = "var(--border)"; (e.currentTarget as HTMLDivElement).style.boxShadow = "var(--shadow-sm)"; (e.currentTarget as HTMLDivElement).style.transform = ""; }}
              >
                <div style={{ width: 52, height: 52, borderRadius: "var(--r-md)", background: "var(--green-light)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24, flexShrink: 0, border: "1px solid var(--green-border)" }}>
                  {TYPE_EMOJI[v.venue_type] || "📍"}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 8, marginBottom: 6 }}>
                    <p style={{ fontSize: 16, fontWeight: 700, color: "var(--text)" }}>{v.venue_name}</p>
                    <Badge variant="ghost" style={{ flexShrink: 0, fontSize: 11 }}>{TYPE_LABELS[v.venue_type] || v.venue_type}</Badge>
                  </div>
                  <p style={{ fontSize: 13, color: "var(--text-3)", marginBottom: 8 }}>{v.city} · {v.days_available} · {v.hours_available}</p>
                  {v.description && <p style={{ fontSize: 13, color: "var(--text-2)", lineHeight: 1.5, overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}>{v.description}</p>}
                  <div style={{ display: "flex", gap: 6, marginTop: 10, flexWrap: "wrap" }}>
                    <span style={{ fontSize: 11, fontWeight: 600, color: "var(--text-3)" }}>Up to {v.max_trucks} truck{v.max_trucks !== 1 ? "s" : ""}</span>
                    {v.has_electrical && <Badge variant="green" style={{ fontSize: 10 }}>⚡ Electrical</Badge>}
                    {!v.vendor_fee && <Badge variant="green" style={{ fontSize: 10 }}>Free for vendors</Badge>}
                    {v.expected_traffic && <span style={{ fontSize: 11, color: "var(--text-muted)" }}>· {v.expected_traffic} traffic</span>}
                  </div>
                </div>
                <div style={{ color: "var(--text-muted)", fontSize: 18, flexShrink: 0, alignSelf: "center" }}>›</div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
