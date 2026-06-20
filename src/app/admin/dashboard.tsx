"use client";

import { useState } from "react";

type Stats = { vendorCount: number; venueCount: number; bookingCount: number; proVendors: number; pendingVenues: number };

export default function AdminDashboard({ stats, vendors, venues, bookings, recentVendors, recentVenues }: {
  stats: Stats;
  vendors: any[];
  venues: any[];
  bookings: any[];
  recentVendors: any[];
  recentVenues: any[];
}) {
  const [tab, setTab] = useState<"overview"|"vendors"|"venues"|"bookings">("overview");
  const [venueSearch, setVenueSearch] = useState("");
  const [vendorSearch, setVendorSearch] = useState("");

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://vendorbeacon.app";

  const filteredVenues = venues.filter(v =>
    v.venue_name.toLowerCase().includes(venueSearch.toLowerCase()) ||
    v.city?.toLowerCase().includes(venueSearch.toLowerCase())
  );

  const filteredVendors = vendors.filter(v =>
    v.business_name.toLowerCase().includes(vendorSearch.toLowerCase()) ||
    v.contact_email?.toLowerCase().includes(vendorSearch.toLowerCase())
  );

  async function approveVenue(id: string) {
    await fetch("/api/admin/venues", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, is_approved: true }) });
    window.location.reload();
  }

  async function rejectVenue(id: string) {
    if (!confirm("Delete this venue listing?")) return;
    await fetch("/api/admin/venues", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }) });
    window.location.reload();
  }

  async function toggleVendorDisabled(id: string, currentlyDisabled: boolean) {
    const action = currentlyDisabled ? "re-enable" : "disable";
    if (!confirm(`Are you sure you want to ${action} this vendor account?`)) return;
    await fetch("/api/admin/vendors", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, disabled: !currentlyDisabled }) });
    window.location.reload();
  }

  const tabBtn = (key: typeof tab, label: string) => (
    <button onClick={() => setTab(key)}
      className="px-4 py-2.5 text-sm border-b-2 transition"
      style={{ borderColor: tab === key ? "#639922" : "transparent", color: tab === key ? "#2C2C2A" : "#5F5E5A", fontWeight: tab === key ? 600 : 400, background: "none" }}>
      {label}
    </button>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b px-6 py-4 flex items-center justify-between" style={{ borderColor: "#D3D1C7" }}>
        <div>
          <h1 className="text-lg font-bold">VendorBeacon Admin</h1>
          <p className="text-xs" style={{ color: "#5F5E5A" }}>Platform management</p>
        </div>
        <a href="/dashboard" className="text-sm underline" style={{ color: "#639922" }}>← Back to app</a>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 px-6 py-4">
        {[
          { label: "Total vendors", value: stats.vendorCount },
          { label: "Pro vendors", value: stats.proVendors, highlight: true },
          { label: "Venue listings", value: stats.venueCount },
          { label: "Pending approval", value: stats.pendingVenues, alert: stats.pendingVenues > 0 },
          { label: "Total bookings", value: stats.bookingCount },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-xl border p-4 text-center" style={{ borderColor: s.alert ? "#FCA5A5" : "#D3D1C7", background: s.alert ? "#FEF2F2" : "#fff" }}>
            <div className="text-2xl font-bold" style={{ color: s.highlight ? "#639922" : s.alert ? "#DC2626" : "#2C2C2A" }}>{s.value}</div>
            <div className="text-xs mt-1" style={{ color: "#5F5E5A" }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="bg-white border-b px-6 flex" style={{ borderColor: "#D3D1C7" }}>
        {tabBtn("overview", "Overview")}
        {tabBtn("vendors", `Vendors (${stats.vendorCount})`)}
        {tabBtn("venues", `Venues (${stats.venueCount})`)}
        {tabBtn("bookings", `Bookings (${stats.bookingCount})`)}
      </div>

      <div className="px-6 py-6">

        {/* OVERVIEW */}
        {tab === "overview" && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="bg-white rounded-xl border p-4" style={{ borderColor: "#D3D1C7" }}>
              <h2 className="text-sm font-semibold mb-3">Recent vendors</h2>
              <div className="space-y-2">
                {recentVendors.map((v: any) => (
                  <div key={v.id} className="flex items-center justify-between py-1.5 border-b last:border-0" style={{ borderColor: "#D3D1C7" }}>
                    <div>
                      <p className="text-sm font-medium">{v.business_name}</p>
                      <p className="text-xs" style={{ color: "#5F5E5A" }}>{v.contact_email}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      {v.is_pro && <span className="text-xs px-1.5 py-0.5 rounded-full font-medium text-white" style={{ background: "#639922" }}>Pro</span>}
                      <a href={`/t/${v.slug}`} target="_blank" rel="noopener noreferrer" className="text-xs underline" style={{ color: "#639922" }}>View</a>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="bg-white rounded-xl border p-4" style={{ borderColor: "#D3D1C7" }}>
              <h2 className="text-sm font-semibold mb-3">Recent venues {stats.pendingVenues > 0 && <span className="text-xs font-bold ml-1 px-1.5 py-0.5 rounded-full text-white" style={{ background: "#DC2626" }}>{stats.pendingVenues} pending</span>}</h2>
              <div className="space-y-2">
                {recentVenues.map((v: any) => (
                  <div key={v.id} className="flex items-center justify-between py-1.5 border-b last:border-0" style={{ borderColor: "#D3D1C7" }}>
                    <div>
                      <p className="text-sm font-medium">{v.venue_name}</p>
                      <p className="text-xs" style={{ color: "#5F5E5A" }}>{v.city} · {v.venue_type}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      {!v.is_approved ? (
                        <>
                          <button onClick={() => approveVenue(v.id)} className="text-xs px-2 py-1 rounded font-medium text-white" style={{ background: "#639922" }}>Approve</button>
                          <button onClick={() => rejectVenue(v.id)} className="text-xs px-2 py-1 rounded font-medium text-white" style={{ background: "#DC2626" }}>Reject</button>
                        </>
                      ) : (
                        <span className="text-xs px-1.5 py-0.5 rounded-full text-white font-medium" style={{ background: "#639922" }}>Live</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* VENDORS */}
        {tab === "vendors" && (
          <div className="bg-white rounded-xl border overflow-hidden" style={{ borderColor: "#D3D1C7" }}>
            <div className="px-4 py-3 border-b" style={{ borderColor: "#D3D1C7" }}>
              <input type="text" value={vendorSearch} onChange={e => setVendorSearch(e.target.value)}
                placeholder="Search vendors by name or email..."
                className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none"
                style={{ borderColor: "#D3D1C7" }} />
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ background: "#f8f8f6" }}>
                    {["Business", "Email", "Plan", "Status", "Created", "Actions"].map(h => (
                      <th key={h} className="text-left px-4 py-2 text-xs font-semibold" style={{ color: "#5F5E5A" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredVendors.map((v: any, i: number) => (
                    <tr key={v.id} style={{ borderTop: i > 0 ? "1px solid #D3D1C7" : "none" }}>
                      <td className="px-4 py-2.5 font-medium">{v.business_name}</td>
                      <td className="px-4 py-2.5 text-xs" style={{ color: "#5F5E5A" }}>{v.contact_email}</td>
                      <td className="px-4 py-2.5">
                        <span className="text-xs px-2 py-0.5 rounded-full font-medium"
                          style={{ background: v.is_pro ? "#EAF3DE" : "#f0f0ee", color: v.is_pro ? "#3B6D11" : "#5F5E5A" }}>
                          {v.is_pro ? "Pro" : "Free"}
                        </span>
                      </td>
                      <td className="px-4 py-2.5">
                        <span className="text-xs px-2 py-0.5 rounded-full font-medium"
                          style={{ background: v.disabled ? "#FEE2E2" : "#EAF3DE", color: v.disabled ? "#991B1B" : "#3B6D11" }}>
                          {v.disabled ? "Disabled" : "Active"}
                        </span>
                      </td>
                      <td className="px-4 py-2.5 text-xs" style={{ color: "#5F5E5A" }}>
                        {new Date(v.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-2.5">
                        <div className="flex gap-2">
                          <a href={`/t/${v.slug}`} target="_blank" rel="noopener noreferrer" className="text-xs underline" style={{ color: "#639922" }}>View page</a>
                          <button onClick={() => toggleVendorDisabled(v.id, v.disabled)}
                            className="text-xs underline"
                            style={{ color: v.disabled ? "#639922" : "#A32D2D" }}>
                            {v.disabled ? "Re-enable" : "Disable"}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* VENUES */}
        {tab === "venues" && (
          <div className="bg-white rounded-xl border overflow-hidden" style={{ borderColor: "#D3D1C7" }}>
            <div className="px-4 py-3 border-b" style={{ borderColor: "#D3D1C7" }}>
              <input type="text" value={venueSearch} onChange={e => setVenueSearch(e.target.value)}
                placeholder="Search venues by name or city..."
                className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none"
                style={{ borderColor: "#D3D1C7" }} />
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ background: "#f8f8f6" }}>
                    {["Venue", "City", "Type", "Status", "Created", "Actions"].map(h => (
                      <th key={h} className="text-left px-4 py-2 text-xs font-semibold" style={{ color: "#5F5E5A" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredVenues.map((v: any, i: number) => (
                    <tr key={v.id} style={{ borderTop: i > 0 ? "1px solid #D3D1C7" : "none" }}>
                      <td className="px-4 py-2.5 font-medium">{v.venue_name}</td>
                      <td className="px-4 py-2.5 text-xs" style={{ color: "#5F5E5A" }}>{v.city}</td>
                      <td className="px-4 py-2.5 text-xs">{v.venue_type}</td>
                      <td className="px-4 py-2.5">
                        <span className="text-xs px-2 py-0.5 rounded-full font-medium"
                          style={{ background: v.is_approved ? "#EAF3DE" : "#FEF9C3", color: v.is_approved ? "#3B6D11" : "#854D0E" }}>
                          {v.is_approved ? "Live" : "Pending"}
                        </span>
                      </td>
                      <td className="px-4 py-2.5 text-xs" style={{ color: "#5F5E5A" }}>
                        {new Date(v.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-2.5">
                        <div className="flex gap-2">
                          <a href={`/venue/${v.slug}`} target="_blank" rel="noopener noreferrer" className="text-xs underline" style={{ color: "#639922" }}>View</a>
                          {!v.is_approved && <button onClick={() => approveVenue(v.id)} className="text-xs underline" style={{ color: "#639922" }}>Approve</button>}
                          <button onClick={() => rejectVenue(v.id)} className="text-xs underline" style={{ color: "#A32D2D" }}>Delete</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* BOOKINGS */}
        {tab === "bookings" && (
          <div className="bg-white rounded-xl border overflow-hidden" style={{ borderColor: "#D3D1C7" }}>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ background: "#f8f8f6" }}>
                    {["Venue", "Contact", "Date", "Status", "Created"].map(h => (
                      <th key={h} className="text-left px-4 py-2 text-xs font-semibold" style={{ color: "#5F5E5A" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {bookings.map((b: any, i: number) => (
                    <tr key={b.id} style={{ borderTop: i > 0 ? "1px solid #D3D1C7" : "none" }}>
                      <td className="px-4 py-2.5 font-medium">{b.venue_name}</td>
                      <td className="px-4 py-2.5 text-xs" style={{ color: "#5F5E5A" }}>{b.contact_name}<br/>{b.contact_email}</td>
                      <td className="px-4 py-2.5 text-xs">{new Date(b.event_date + "T12:00:00").toLocaleDateString()}</td>
                      <td className="px-4 py-2.5">
                        <span className="text-xs px-2 py-0.5 rounded-full font-medium"
                          style={{
                            background: b.status === "approved" ? "#EAF3DE" : b.status === "declined" ? "#FEE2E2" : "#FEF9C3",
                            color: b.status === "approved" ? "#3B6D11" : b.status === "declined" ? "#991B1B" : "#854D0E"
                          }}>
                          {b.status}
                        </span>
                      </td>
                      <td className="px-4 py-2.5 text-xs" style={{ color: "#5F5E5A" }}>{new Date(b.created_at).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
