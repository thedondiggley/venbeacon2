"use client";

import { useState, useEffect } from "react";
import { Logo } from "@/components/logo";
import { useParams } from "next/navigation";

const VENUE_TYPES = [
  { value: "brewery", label: "Brewery / taproom" },
  { value: "apartment", label: "Apartment community" },
  { value: "office", label: "Office park" },
  { value: "shopping", label: "Shopping center" },
  { value: "park", label: "Park / outdoor space" },
  { value: "event_space", label: "Event space" },
  { value: "other", label: "Other" },
];

const DAYS = ["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday"];

type DaySchedule = { enabled: boolean; open: string; close: string };
type Schedule = Record<string, DaySchedule>;

export default function VenueEditPage() {
  const params = useParams();
  const token = params.token as string;

  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [expired, setExpired] = useState(false);
  const [refreshEmail, setRefreshEmail] = useState("");
  const [refreshSent, setRefreshSent] = useState(false);
  const [refreshSending, setRefreshSending] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [saved, setSaved] = useState(false);
  const [deleted, setDeleted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const [venueId, setVenueId] = useState("");
  const [venueName, setVenueName] = useState("");
  const [venueType, setVenueType] = useState("");
  const [otherType, setOtherType] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [description, setDescription] = useState("");
  const [maxTrucks, setMaxTrucks] = useState("1");
  const [contactName, setContactName] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [useCustom, setUseCustom] = useState(false);
  const [simpleDays, setSimpleDays] = useState("");
  const [simpleHours, setSimpleHours] = useState("");
  const [schedule, setSchedule] = useState<Schedule>(
    Object.fromEntries(DAYS.map(d => [d, { enabled: false, open: "11:00", close: "14:00" }]))
  );

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/venue-listings/edit?token=${token}`);
        if (res.status === 404) { setNotFound(true); return; }
        if (res.status === 410) { setExpired(true); return; }
        if (!res.ok) throw new Error("Failed to load listing.");
        const data = await res.json();
        const v = data.venue;
        setVenueId(v.id);
        setVenueName(v.venue_name);
        setVenueType(v.venue_type);
        setAddress(v.address);
        setCity(v.city);
        setDescription(v.description ?? "");
        setMaxTrucks(String(v.max_trucks ?? 1));
        setContactName(v.contact_name);
        setContactEmail(v.contact_email);
        setContactPhone(v.contact_phone ?? "");
        setSimpleDays(v.days_available ?? "");
        setSimpleHours(v.hours_available ?? "");
      } catch {
        setError("Failed to load your listing.");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [token]);

  function toggleDay(day: string) {
    setSchedule(prev => ({ ...prev, [day]: { ...prev[day], enabled: !prev[day].enabled } }));
  }
  function updateTime(day: string, field: "open" | "close", val: string) {
    setSchedule(prev => ({ ...prev, [day]: { ...prev[day], [field]: val } }));
  }

  function buildScheduleSummary() {
    const fmt = (t: string) => {
      const [h, m] = t.split(":").map(Number);
      const ap = h >= 12 ? "pm" : "am";
      const h12 = h > 12 ? h - 12 : h === 0 ? 12 : h;
      return m === 0 ? `${h12}${ap}` : `${h12}:${m.toString().padStart(2,"0")}${ap}`;
    };
    const abbr: Record<string,string> = { Monday:"Mon",Tuesday:"Tue",Wednesday:"Wed",Thursday:"Thu",Friday:"Fri",Saturday:"Sat",Sunday:"Sun" };
    const active = DAYS.filter(d => schedule[d].enabled);
    if (!active.length) return { days: "", hours: "" };
    const days = active.map(d => abbr[d]).join(", ");
    const hrs = active.map(d => `${fmt(schedule[d].open)}–${fmt(schedule[d].close)}`);
    const unique = [...new Set(hrs)];
    const hours = unique.length === 1 ? unique[0] : hrs.map((h,i) => `${abbr[active[i]]}: ${h}`).join(", ");
    return { days, hours };
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSaved(false);

    let daysAvailable = simpleDays;
    let hoursAvailable = simpleHours;

    if (useCustom) {
      const s = buildScheduleSummary();
      if (!s.days) { setError("Please select at least one day."); return; }
      daysAvailable = s.days;
      hoursAvailable = s.hours;
    }

    if (!daysAvailable || !hoursAvailable) {
      setError("Please enter your available days and hours.");
      return;
    }

    setSaving(true);
    try {
      const res = await fetch(`/api/venue-listings/edit?token=${token}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          venueName, venueType, venueTypeCustom: venueType === "other" ? otherType : null,
          address, city, daysAvailable, hoursAvailable,
          description, maxTrucks: parseInt(maxTrucks) || 1,
          contactName, contactEmail, contactPhone,
        }),
      });
      if (!res.ok) { const d = await res.json(); throw new Error(d.error); }
      setSaved(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    setDeleting(true);
    try {
      const res = await fetch(`/api/venue-listings/edit?token=${token}`, { method: "DELETE" });
      if (!res.ok) { const d = await res.json(); throw new Error(d.error); }
      setDeleted(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Delete failed.");
      setDeleting(false);
    }
  }

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <p className="text-sm" style={{ color: "var(--brand-charcoal-soft)" }}>Loading your listing...</p>
    </div>
  );

  if (notFound) return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="text-center max-w-sm">
        <Logo variant="mark" size={44} className="mx-auto mb-4" />
        <h1 className="text-lg font-medium mb-2">Listing not found</h1>
        <p className="text-sm" style={{ color: "var(--brand-charcoal-soft)" }}>
          This edit link is invalid.
        </p>
      </div>
    </div>
  );

  if (expired) return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="text-center max-w-sm w-full">
        <Logo variant="mark" size={44} className="mx-auto mb-4" />
        <h1 className="text-lg font-medium mb-2">This link has expired</h1>
        <p className="text-sm mb-6" style={{ color: "var(--brand-charcoal-soft)" }}>
          Edit links expire after 90 days for security. Enter your email below and we'll send you a fresh one.
        </p>

        {refreshSent ? (
          <p className="text-sm" style={{ color: "var(--brand-green-dark)" }}>
            If a listing was found for that email, a new link is on its way. Check your inbox.
          </p>
        ) : (
          <div className="space-y-3 text-left">
            <input
              type="email"
              value={refreshEmail}
              onChange={e => setRefreshEmail(e.target.value)}
              placeholder="you@venue.com"
              className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2"
              style={{ borderColor: "var(--brand-line)" }}
            />
            <button
              onClick={async () => {
                if (!refreshEmail.trim()) return;
                setRefreshSending(true);
                await fetch("/api/venue-listings/refresh-link", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ email: refreshEmail }),
                }).catch(() => {});
                setRefreshSending(false);
                setRefreshSent(true);
              }}
              disabled={refreshSending}
              className="w-full rounded-lg py-2.5 text-sm font-medium text-white disabled:opacity-60"
              style={{ background: "var(--brand-green)" }}>
              {refreshSending ? "Sending..." : "Send me a new link"}
            </button>
          </div>
        )}
      </div>
    </div>
  );

  if (deleted) return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="text-center max-w-sm">
        <Logo variant="mark" size={44} className="mx-auto mb-4" />
        <h1 className="text-lg font-medium mb-2">Listing removed</h1>
        <p className="text-sm" style={{ color: "var(--brand-charcoal-soft)" }}>
          Your venue has been removed from the VendorBeacon board.
        </p>
      </div>
    </div>
  );

  if (saved) return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="text-center max-w-sm">
        <Logo variant="mark" size={44} className="mx-auto mb-4" />
        <h1 className="text-lg font-medium mb-2">Changes saved!</h1>
        <p className="text-sm mb-4" style={{ color: "var(--brand-charcoal-soft)" }}>
          Your venue listing has been updated on VendorBeacon.
        </p>
        <button onClick={() => setSaved(false)}
          className="text-sm underline" style={{ color: "var(--brand-green-dark)" }}>
          Make more changes
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-md mx-auto px-4 py-8 pb-20">
        <div className="mb-6"><Logo variant="full" size={30} /></div>
        <h1 className="text-xl font-medium mb-1">Edit your venue listing</h1>
        <p className="text-sm mb-6" style={{ color: "var(--brand-charcoal-soft)" }}>
          Update your info or remove your listing from the board.
        </p>

        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1.5">Venue name</label>
            <input type="text" required value={venueName} onChange={e => setVenueName(e.target.value)}
              className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2"
              style={{ borderColor: "var(--brand-line)" }} />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5">Venue type</label>
            <select value={venueType} onChange={e => setVenueType(e.target.value)} required
              className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2"
              style={{ borderColor: "var(--brand-line)" }}>
              {VENUE_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
            {venueType === "other" && (
              <input type="text" value={otherType} onChange={e => setOtherType(e.target.value)}
                placeholder="Describe your venue type" required
                className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 mt-2"
                style={{ borderColor: "var(--brand-line)" }} />
            )}
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5">Street address</label>
            <input type="text" required value={address} onChange={e => setAddress(e.target.value)}
              className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2"
              style={{ borderColor: "var(--brand-line)" }} />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5">City</label>
            <input type="text" required value={city} onChange={e => setCity(e.target.value)}
              className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2"
              style={{ borderColor: "var(--brand-line)" }} />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5">Max food trucks at one time</label>
            <select value={maxTrucks} onChange={e => setMaxTrucks(e.target.value)}
              className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2"
              style={{ borderColor: "var(--brand-line)" }}>
              {[1,2,3,4,5,6,7,8,9,10].map(n => (
                <option key={n} value={n}>{n} {n === 1 ? "truck" : "trucks"}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5">Availability</label>
            <div className="flex gap-3 mb-3">
              <button type="button" onClick={() => setUseCustom(false)}
                className="flex-1 rounded-lg py-2 text-sm font-medium border transition"
                style={{ background: !useCustom ? "var(--brand-green)" : "#fff", color: !useCustom ? "#fff" : "var(--brand-charcoal-soft)", borderColor: !useCustom ? "var(--brand-green)" : "var(--brand-line)" }}>
                Simple
              </button>
              <button type="button" onClick={() => setUseCustom(true)}
                className="flex-1 rounded-lg py-2 text-sm font-medium border transition"
                style={{ background: useCustom ? "var(--brand-green)" : "#fff", color: useCustom ? "#fff" : "var(--brand-charcoal-soft)", borderColor: useCustom ? "var(--brand-green)" : "var(--brand-line)" }}>
                Custom per day
              </button>
            </div>
            {!useCustom ? (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium mb-1" style={{ color: "var(--brand-charcoal-soft)" }}>Days</label>
                  <input type="text" value={simpleDays} onChange={e => setSimpleDays(e.target.value)}
                    placeholder="e.g. Mon–Fri"
                    className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none"
                    style={{ borderColor: "var(--brand-line)" }} />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1" style={{ color: "var(--brand-charcoal-soft)" }}>Hours</label>
                  <input type="text" value={simpleHours} onChange={e => setSimpleHours(e.target.value)}
                    placeholder="e.g. 11am–2pm"
                    className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none"
                    style={{ borderColor: "var(--brand-line)" }} />
                </div>
              </div>
            ) : (
              <div className="border rounded-lg overflow-hidden" style={{ borderColor: "var(--brand-line)" }}>
                {DAYS.map((day, i) => (
                  <div key={day} className="flex items-center gap-3 px-3 py-2"
                    style={{ borderBottom: i < DAYS.length - 1 ? "1px solid var(--brand-line)" : "none", background: schedule[day].enabled ? "var(--brand-green-light)" : "#fff" }}>
                    <button type="button" onClick={() => toggleDay(day)}
                      className="w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0"
                      style={{ borderColor: schedule[day].enabled ? "var(--brand-green)" : "var(--brand-line)", background: schedule[day].enabled ? "var(--brand-green)" : "#fff" }}>
                      {schedule[day].enabled && <span style={{ color: "#fff", fontSize: "10px" }}>✓</span>}
                    </button>
                    <span className="text-sm font-medium w-24 shrink-0">{day}</span>
                    {schedule[day].enabled ? (
                      <div className="flex items-center gap-2 flex-1">
                        <input type="time" value={schedule[day].open} onChange={e => updateTime(day, "open", e.target.value)}
                          className="flex-1 rounded border px-2 py-1 text-xs" style={{ borderColor: "var(--brand-line)" }} />
                        <span className="text-xs" style={{ color: "var(--brand-charcoal-soft)" }}>to</span>
                        <input type="time" value={schedule[day].close} onChange={e => updateTime(day, "close", e.target.value)}
                          className="flex-1 rounded border px-2 py-1 text-xs" style={{ borderColor: "var(--brand-line)" }} />
                      </div>
                    ) : (
                      <span className="text-xs" style={{ color: "var(--brand-charcoal-soft)" }}>Closed</span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5">Description <span style={{ color: "var(--brand-green-dark)", fontSize: "11px" }}>required</span></label>
            <textarea rows={4} required value={description} onChange={e => setDescription(e.target.value)}
              placeholder="Tell food truck operators what makes your spot great..."
              className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2"
              style={{ borderColor: "var(--brand-line)" }} />
          </div>

          <div className="border-t pt-4" style={{ borderColor: "var(--brand-line)" }}>
            <p className="text-xs font-semibold mb-3" style={{ color: "var(--brand-charcoal-soft)" }}>CONTACT INFO</p>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium mb-1.5">Contact name or business name</label>
                <input type="text" required value={contactName} onChange={e => setContactName(e.target.value)}
                  className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2"
                  style={{ borderColor: "var(--brand-line)" }} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium mb-1.5">Email</label>
                  <input type="email" required value={contactEmail} onChange={e => setContactEmail(e.target.value)}
                    className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2"
                    style={{ borderColor: "var(--brand-line)" }} />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5">Phone <span style={{ fontWeight: 400 }}>(optional)</span></label>
                  <input type="tel" value={contactPhone} onChange={e => setContactPhone(e.target.value)}
                    className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2"
                    style={{ borderColor: "var(--brand-line)" }} />
                </div>
              </div>
            </div>
          </div>

          {error && <p className="text-sm" style={{ color: "#A32D2D" }}>{error}</p>}

          <button type="submit" disabled={saving}
            className="w-full rounded-lg py-2.5 text-sm font-medium text-white disabled:opacity-60"
            style={{ background: "var(--brand-green)" }}>
            {saving ? "Saving..." : "Save changes"}
          </button>
        </form>

        <div className="mt-8 pt-6 border-t" style={{ borderColor: "var(--brand-line)" }}>
          <h2 className="text-sm font-medium mb-1">Remove your listing</h2>
          <p className="text-sm mb-4" style={{ color: "var(--brand-charcoal-soft)" }}>
            This will permanently remove your venue from the VendorBeacon board. Food truck operators will no longer be able to find you.
          </p>
          {!confirmDelete ? (
            <button onClick={() => setConfirmDelete(true)}
              className="text-sm underline" style={{ color: "#A32D2D" }}>
              Remove my listing
            </button>
          ) : (
            <div className="rounded-lg border p-4" style={{ borderColor: "#F09595" }}>
              <p className="text-sm font-medium mb-3" style={{ color: "#A32D2D" }}>
                Are you sure? This cannot be undone.
              </p>
              <div className="flex gap-3">
                <button onClick={handleDelete} disabled={deleting}
                  className="rounded-lg px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
                  style={{ background: "#A32D2D" }}>
                  {deleting ? "Removing..." : "Yes, remove it"}
                </button>
                <button onClick={() => setConfirmDelete(false)}
                  className="rounded-lg px-4 py-2 text-sm border text-sm"
                  style={{ borderColor: "var(--brand-line)" }}>
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
