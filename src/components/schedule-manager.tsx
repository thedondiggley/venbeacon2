"use client";

import { useState } from "react";

export type Location = {
  id: string;
  vendor_id: string;
  title: string;
  address: string | null;
  start_time: string;
  end_time: string;
  notes: string | null;
  source: "manual" | "booking";
  booking_id: string | null;
};

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString(undefined, {
    weekday: "short", month: "short", day: "numeric",
    hour: "numeric", minute: "2-digit",
  });
}

function toLocalInputValue(iso: string) {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

type FormState = { id?: string; title: string; address: string; start: string; end: string; notes: string };
const emptyForm: FormState = { title: "", address: "", start: "", end: "", notes: "" };

export function ScheduleManager({
  vendorId, isPro, activeCount, initialLocations,
}: {
  vendorId: string;
  isPro: boolean;
  activeCount: number;
  initialLocations: Location[];
}) {
  const [locations, setLocations] = useState<Location[]>(initialLocations);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const atFreeLimit = !isPro && activeCount >= 3;
  const now = new Date();

  function startAdd() {
    setForm(emptyForm);
    setShowForm(true);
    setError(null);
  }

  function startEdit(loc: Location) {
    setForm({
      id: loc.id,
      title: loc.title,
      address: loc.address ?? "",
      start: toLocalInputValue(loc.start_time),
      end: toLocalInputValue(loc.end_time),
      notes: loc.notes ?? "",
    });
    setShowForm(true);
    setError(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!form.title || !form.start || !form.end) { setError("Title, start, and end are required."); return; }
    if (new Date(form.end) <= new Date(form.start)) { setError("End time must be after start time."); return; }
    setSaving(true);

    const payload = {
      vendor_id: vendorId,
      title: form.title,
      address: form.address || null,
      start_time: new Date(form.start).toISOString(),
      end_time: new Date(form.end).toISOString(),
      notes: form.notes || null,
    };

    try {
      if (form.id) {
        // Update via Supabase client directly (updates don't add entries)
        const res = await fetch(`/api/locations/${form.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error);
        setLocations(prev =>
          prev.map(l => l.id === form.id ? data : l)
            .sort((a, b) => a.start_time.localeCompare(b.start_time))
        );
      } else {
        // Create via API (enforces free limit at server)
        const res = await fetch("/api/locations", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error);
        setLocations(prev =>
          [...prev, data].sort((a, b) => a.start_time.localeCompare(b.start_time))
        );
      }
      setShowForm(false);
      setForm(emptyForm);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    const res = await fetch(`/api/locations/${id}`, { method: "DELETE" });
    if (res.ok) setLocations(prev => prev.filter(l => l.id !== id));
  }

  const upcoming = locations.filter(l => new Date(l.end_time) >= now);

  return (
    <div>
      {!showForm && (
        atFreeLimit ? (
          <div className="rounded-lg border p-4 mb-6" style={{ borderColor: "var(--brand-line)", background: "#fafaf8" }}>
            <p className="text-sm font-medium mb-1" style={{ color: "var(--brand-charcoal)" }}>
              You've reached the free plan limit (3 active stops)
            </p>
            <p className="text-sm mb-3" style={{ color: "var(--brand-charcoal-soft)" }}>
              Upgrade to Pro for unlimited schedule entries.
            </p>
            <a href="/pricing" className="inline-block rounded-lg px-4 py-2 text-sm font-medium text-white" style={{ background: "var(--brand-green)" }}>
              Upgrade to Pro
            </a>
          </div>
        ) : (
          <button onClick={startAdd} className="rounded-lg px-4 py-2 text-sm font-medium text-white mb-6" style={{ background: "var(--brand-green)" }}>
            Add a stop
          </button>
        )
      )}

      {showForm && (
        <form onSubmit={handleSubmit} className="rounded-lg border p-4 mb-6 space-y-3" style={{ borderColor: "var(--brand-line)" }}>
          <div>
            <label className="block text-sm font-medium mb-1.5">Where</label>
            <input type="text" required placeholder="Main Street Brewery" value={form.title}
              onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
              className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2" style={{ borderColor: "var(--brand-line)" }}/>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5">Address (optional)</label>
            <input type="text" placeholder="123 Main St, Your City, TN" value={form.address}
              onChange={e => setForm(f => ({ ...f, address: e.target.value }))}
              className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2" style={{ borderColor: "var(--brand-line)" }}/>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium mb-1.5">Start</label>
              <input type="datetime-local" required value={form.start}
                onChange={e => setForm(f => ({ ...f, start: e.target.value }))}
                className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2" style={{ borderColor: "var(--brand-line)" }}/>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">End</label>
              <input type="datetime-local" required value={form.end}
                onChange={e => setForm(f => ({ ...f, end: e.target.value }))}
                className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2" style={{ borderColor: "var(--brand-line)" }}/>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5">Notes (optional)</label>
            <input type="text" placeholder="Tacos and elote, cash + card" value={form.notes}
              onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
              className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2" style={{ borderColor: "var(--brand-line)" }}/>
          </div>
          {error && <p className="text-sm" style={{ color: "#A32D2D" }}>{error}</p>}
          <div className="flex gap-2">
            <button type="submit" disabled={saving} className="rounded-lg px-4 py-2 text-sm font-medium text-white disabled:opacity-60" style={{ background: "var(--brand-green)" }}>
              {saving ? "Saving..." : form.id ? "Save changes" : "Add stop"}
            </button>
            <button type="button" onClick={() => setShowForm(false)} className="rounded-lg px-4 py-2 text-sm border" style={{ borderColor: "var(--brand-line)" }}>
              Cancel
            </button>
          </div>
        </form>
      )}

      {upcoming.length === 0 ? (
        <div className="rounded-lg border p-6 text-center" style={{ borderColor: "var(--brand-line)" }}>
          <p className="text-sm font-medium">No upcoming stops yet.</p>
          <p className="text-sm mt-1" style={{ color: "var(--brand-charcoal-soft)" }}>Add your first stop above and it'll show on your public page instantly.</p>
        </div>
      ) : (
        <ul className="space-y-2">
          {upcoming.map(loc => {
            const isToday = new Date(loc.start_time).toDateString() === now.toDateString();
            return (
              <li key={loc.id} className="rounded-lg border p-3 flex items-start justify-between gap-3"
                style={{ borderColor: "var(--brand-line)", background: isToday ? "var(--brand-green-light)" : "transparent" }}>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium text-sm">{loc.title}</span>
                    {isToday && <span className="text-xs font-medium px-2 py-0.5 rounded-full text-white" style={{ background: "var(--brand-green)" }}>Today</span>}
                    {loc.source === "booking" && <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: "var(--brand-line)", color: "var(--brand-charcoal-soft)" }}>Booked</span>}
                  </div>
                  <p className="text-sm mt-0.5" style={{ color: "var(--brand-charcoal-soft)" }}>{formatDateTime(loc.start_time)} – {formatDateTime(loc.end_time)}</p>
                  {loc.address && <p className="text-sm mt-0.5" style={{ color: "var(--brand-charcoal-soft)" }}>{loc.address}</p>}
                  {loc.notes && <p className="text-sm mt-0.5" style={{ color: "var(--brand-charcoal-soft)" }}>{loc.notes}</p>}
                </div>
                <div className="flex gap-2 shrink-0">
                  <button onClick={() => startEdit(loc)} className="text-sm underline" style={{ color: "var(--brand-green-dark)" }}>Edit</button>
                  <button onClick={() => handleDelete(loc.id)} className="text-sm underline" style={{ color: "#A32D2D" }}>Remove</button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
