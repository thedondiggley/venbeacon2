"use client";

import { useState } from "react";
import { Button, Card, Input, Textarea, Badge, useToast, PageHeader, Tabs, Modal } from "@/components/ui";

export type Location = {
  id: string; vendor_id: string; title: string; address: string | null;
  start_time: string; end_time: string; notes: string | null;
  source: "manual" | "booking"; booking_id: string | null;
};

function fmt(iso: string) { return new Date(iso).toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" }); }
function fmtT(iso: string) { return new Date(iso).toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" }); }
function toLocal(iso: string) {
  const d = new Date(iso);
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth()+1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;
}

const EMPTY = { title: "", address: "", start: "", end: "", notes: "" };

export function ScheduleManager({ locations: initial, vendorId, isPro }: {
  locations: Location[]; vendorId: string; isPro: boolean;
}) {
  const { toast } = useToast();
  const [locations, setLocations] = useState(initial);
  const [form, setForm] = useState(EMPTY);
  const [editId, setEditId] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const FREE_LIMIT = 3;
  const manualCount = locations.filter(l => l.source === "manual").length;
  const canAdd = isPro || manualCount < FREE_LIMIT;

  const now = new Date();
  const upcoming = locations.filter(l => new Date(l.end_time) >= now).sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime());
  const past = locations.filter(l => new Date(l.end_time) < now).sort((a, b) => new Date(b.start_time).getTime() - new Date(a.start_time).getTime());

  function openAdd() { setForm(EMPTY); setEditId(null); setShowModal(true); }
  function openEdit(loc: Location) {
    setForm({ title: loc.title, address: loc.address || "", start: toLocal(loc.start_time), end: toLocal(loc.end_time), notes: loc.notes || "" });
    setEditId(loc.id); setShowModal(true);
  }

  async function handleSave() {
    if (!form.title || !form.start || !form.end) { toast("Fill in all required fields.", "error"); return; }
    if (new Date(form.start) >= new Date(form.end)) { toast("End time must be after start time.", "error"); return; }
    setSaving(true);
    try {
      const body = { vendorId, title: form.title, address: form.address || null, start_time: new Date(form.start).toISOString(), end_time: new Date(form.end).toISOString(), notes: form.notes || null };
      const res = editId
        ? await fetch(`/api/locations/${editId}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) })
        : await fetch("/api/locations", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      if (editId) {
        setLocations(prev => prev.map(l => l.id === editId ? { ...l, ...body, id: editId, vendor_id: vendorId, source: l.source, booking_id: l.booking_id } : l));
        toast("Stop updated.");
      } else {
        setLocations(prev => [...prev, data]);
        toast("Stop added to your schedule.");
      }
      setShowModal(false);
    } catch (err: any) {
      toast(err.message || "Failed to save.", "error");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    setDeletingId(id);
    try {
      const res = await fetch(`/api/locations/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete");
      setLocations(prev => prev.filter(l => l.id !== id));
      toast("Stop removed.");
    } catch {
      toast("Failed to remove stop.", "error");
    } finally {
      setDeletingId(null);
    }
  }

  function LocationCard({ loc, showDelete = true }: { loc: Location; showDelete?: boolean }) {
    const isBooked = loc.source === "booking";
    const isPast = new Date(loc.end_time) < now;
    return (
      <div style={{
        display: "flex", gap: 12, padding: "14px 16px",
        background: isPast ? "var(--bg)" : "var(--surface)",
        borderRadius: "var(--r-md)",
        border: `1px solid ${isPast ? "var(--border)" : isBooked ? "var(--green-border)" : "var(--border)"}`,
        opacity: isPast ? 0.7 : 1,
        transition: "all var(--t)",
      }}>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", width: 44, flexShrink: 0 }}>
          <div style={{ width: 10, height: 10, borderRadius: "50%", background: isPast ? "var(--border-2)" : isBooked ? "var(--green)" : "var(--green-mid)", marginBottom: 4 }} />
          {isBooked && <span style={{ fontSize: 9, fontWeight: 700, color: "var(--green-mid)", letterSpacing: ".04em" }}>BOOKED</span>}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 8, marginBottom: 4 }}>
            <p style={{ fontSize: 15, fontWeight: 700, color: "var(--text)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{loc.title}</p>
            {isBooked && <Badge variant="green" style={{ flexShrink: 0 }}>Booking</Badge>}
          </div>
          <p style={{ fontSize: 13, color: "var(--text-3)", marginBottom: loc.address ? 4 : 0 }}>
            {fmt(loc.start_time)} · {fmtT(loc.start_time)} – {fmtT(loc.end_time)}
          </p>
          {loc.address && <p style={{ fontSize: 12, color: "var(--text-muted)" }}>📍 {loc.address}</p>}
          {loc.notes && <p style={{ fontSize: 12, color: "var(--text-3)", marginTop: 4, fontStyle: "italic" }}>{loc.notes}</p>}
        </div>
        {showDelete && !isBooked && (
          <div style={{ display: "flex", flexDirection: "column", gap: 6, flexShrink: 0 }}>
            <button onClick={() => openEdit(loc)} style={{ background: "var(--green-light)", border: "1px solid var(--border-2)", borderRadius: "var(--r-sm)", padding: "6px 10px", fontSize: 12, fontWeight: 600, color: "var(--green-mid)", cursor: "pointer" }}>Edit</button>
            <button onClick={() => handleDelete(loc.id)} disabled={deletingId === loc.id} style={{ background: "var(--danger-bg)", border: "1px solid var(--danger)", borderRadius: "var(--r-sm)", padding: "6px 10px", fontSize: 12, fontWeight: 600, color: "var(--danger)", cursor: "pointer", opacity: deletingId === loc.id ? 0.6 : 1 }}>
              {deletingId === loc.id ? "..." : "Remove"}
            </button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }} className="animate-fade-in">
      <PageHeader
        title="Schedule"
        description="Manage where you'll be. Your public page updates automatically."
        action={
          <Button onClick={openAdd} disabled={!canAdd}>
            + Add stop
          </Button>
        }
      />

      {!isPro && (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 16px", background: "var(--dark-2)", borderRadius: "var(--r-md)" }}>
          <p style={{ fontSize: 13, color: "var(--text-on-dark-2)" }}>{manualCount}/{FREE_LIMIT} free stops used</p>
          {!canAdd && (
            <a href="/pricing" style={{ fontSize: 13, fontWeight: 700, color: "var(--green)", textDecoration: "none" }}>Upgrade for unlimited →</a>
          )}
        </div>
      )}

      {upcoming.length === 0 && past.length === 0 ? (
        <Card padding="lg">
          <div style={{ textAlign: "center", padding: "32px 0" }}>
            <p style={{ fontSize: 36, marginBottom: 14 }}>📅</p>
            <p style={{ fontSize: 16, fontWeight: 700, color: "var(--text)", marginBottom: 6 }}>Your schedule is empty</p>
            <p style={{ fontSize: 14, color: "var(--text-3)", marginBottom: 20, maxWidth: 280, margin: "0 auto 20px" }}>Add your first stop so customers know where to find you this week.</p>
            <Button onClick={openAdd} disabled={!canAdd}>Add your first stop</Button>
          </div>
        </Card>
      ) : (
        <>
          {upcoming.length > 0 && (
            <div>
              <p style={{ fontSize: 13, fontWeight: 700, color: "var(--text-3)", textTransform: "uppercase", letterSpacing: ".06em", marginBottom: 10 }}>Upcoming</p>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {upcoming.map(loc => <LocationCard key={loc.id} loc={loc} />)}
              </div>
            </div>
          )}
          {past.length > 0 && (
            <div>
              <p style={{ fontSize: 13, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: ".06em", marginBottom: 10 }}>Past</p>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {past.slice(0, 5).map(loc => <LocationCard key={loc.id} loc={loc} showDelete={false} />)}
              </div>
            </div>
          )}
        </>
      )}

      <Modal
        open={showModal}
        onClose={() => setShowModal(false)}
        title={editId ? "Edit stop" : "Add stop"}
        footer={
          <>
            <Button variant="ghost" onClick={() => setShowModal(false)}>Cancel</Button>
            <Button onClick={handleSave} loading={saving}>{editId ? "Save changes" : "Add stop"}</Button>
          </>
        }
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <Input label="Location name *" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="WanderLinger Brewing" required />
          <Input label="Address" value={form.address} onChange={e => setForm(f => ({ ...f, address: e.target.value }))} placeholder="55 Station St, Chattanooga, TN" />
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <Input label="Start time *" type="datetime-local" value={form.start} onChange={e => setForm(f => ({ ...f, start: e.target.value }))} required />
            <Input label="End time *" type="datetime-local" value={form.end} onChange={e => setForm(f => ({ ...f, end: e.target.value }))} required />
          </div>
          <Textarea label="Notes" value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} placeholder="Any notes for customers..." rows={2} />
        </div>
      </Modal>
    </div>
  );
}
