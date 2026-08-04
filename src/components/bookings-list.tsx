"use client";

import { useState } from "react";
import { Button, Card, Badge, PageHeader, Tabs, Modal, useToast, AlertBanner } from "@/components/ui";

export type Booking = {
  id: string; vendor_id: string; venue_name: string;
  venue_contact_name: string; venue_contact_email: string;
  venue_contact_phone: string | null; event_date: string;
  event_details: string | null; status: "pending" | "approved" | "declined";
  created_at: string;
};

function fmt(d: string) { return new Date(d + "T12:00:00").toLocaleDateString(undefined, { weekday: "long", year: "numeric", month: "long", day: "numeric" }); }
function fmtShort(d: string) { return new Date(d).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" }); }

export function BookingsList({ bookings: initial }: { bookings: Booking[] }) {
  const { toast } = useToast();
  const [bookings, setBookings] = useState(initial);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [tab, setTab] = useState<"pending" | "approved" | "declined">("pending");
  const [selected, setSelected] = useState<Booking | null>(null);

  const pending = bookings.filter(b => b.status === "pending");
  const approved = bookings.filter(b => b.status === "approved");
  const declined = bookings.filter(b => b.status === "declined");
  const shown = bookings.filter(b => b.status === tab).sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  async function handleAction(id: string, action: "approve" | "decline") {
    setLoadingId(id);
    try {
      const res = await fetch(`/api/bookings/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setBookings(prev => prev.map(b => b.id === id ? { ...b, status: action === "approve" ? "approved" : "declined" } : b));
      toast(action === "approve" ? "Booking approved — added to your schedule." : "Booking declined.", action === "approve" ? "success" : "info");
      setSelected(null);
    } catch (err: any) {
      toast(err.message || "Something went wrong.", "error");
    } finally {
      setLoadingId(null);
    }
  }

  const badgeVariant = (s: string) => s === "pending" ? "warning" : s === "approved" ? "green" : "ghost";

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }} className="animate-fade-in">
      <PageHeader title="Bookings" description="Venue requests to book you for events or regular spots." />

      {pending.length > 0 && (
        <AlertBanner type="success" title={`${pending.length} request${pending.length > 1 ? "s" : ""} need your response`} description="Venues are waiting. Respond within 48 hours to maintain good standing." />
      )}

      <Tabs
        active={tab}
        onChange={v => setTab(v as typeof tab)}
        tabs={[
          { value: "pending", label: "Pending", count: pending.length },
          { value: "approved", label: "Approved", count: approved.length },
          { value: "declined", label: "Declined", count: declined.length },
        ]}
      />

      {shown.length === 0 ? (
        <Card padding="lg">
          <div style={{ textAlign: "center", padding: "32px 0" }}>
            <p style={{ fontSize: 36, marginBottom: 14 }}>📥</p>
            <p style={{ fontSize: 16, fontWeight: 700, color: "var(--text)", marginBottom: 6 }}>
              {tab === "pending" ? "No pending requests" : tab === "approved" ? "No approved bookings yet" : "No declined bookings"}
            </p>
            <p style={{ fontSize: 14, color: "var(--text-3)" }}>
              {tab === "pending" ? "When venues request to book you, they'll show up here." : "Approved bookings are automatically added to your schedule."}
            </p>
          </div>
        </Card>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {shown.map(b => (
            <div key={b.id}
              onClick={() => setSelected(b)}
              style={{
                display: "flex", alignItems: "center", gap: 14, padding: "16px 18px",
                background: "var(--surface)", borderRadius: "var(--r-lg)",
                border: `1px solid ${b.status === "pending" ? "var(--border-2)" : "var(--border)"}`,
                cursor: "pointer", transition: "all var(--t)",
                boxShadow: "var(--shadow-sm)",
              }}
              onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.borderColor = "var(--green-border)"; (e.currentTarget as HTMLDivElement).style.boxShadow = "var(--shadow-md)"; }}
              onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.borderColor = b.status === "pending" ? "var(--border-2)" : "var(--border)"; (e.currentTarget as HTMLDivElement).style.boxShadow = "var(--shadow-sm)"; }}
            >
              <div style={{ width: 44, height: 44, borderRadius: "var(--r-md)", background: "var(--green-light)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, flexShrink: 0 }}>🏢</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                  <p style={{ fontSize: 15, fontWeight: 700, color: "var(--text)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{b.venue_name}</p>
                  <Badge variant={badgeVariant(b.status) as any} style={{ flexShrink: 0 }}>
                    {b.status.charAt(0).toUpperCase() + b.status.slice(1)}
                  </Badge>
                </div>
                <p style={{ fontSize: 13, color: "var(--text-3)" }}>{fmt(b.event_date)}</p>
                <p style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2 }}>From {b.venue_contact_name} · Received {fmtShort(b.created_at)}</p>
              </div>
              {b.status === "pending" && (
                <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
                  <button onClick={e => { e.stopPropagation(); handleAction(b.id, "approve"); }} disabled={loadingId === b.id}
                    style={{ background: "var(--green)", color: "var(--green-dark)", fontSize: 12, fontWeight: 700, padding: "7px 14px", borderRadius: 9999, border: "none", cursor: "pointer", opacity: loadingId === b.id ? 0.6 : 1 }}>
                    {loadingId === b.id ? "..." : "Approve"}
                  </button>
                  <button onClick={e => { e.stopPropagation(); handleAction(b.id, "decline"); }} disabled={loadingId === b.id}
                    style={{ background: "var(--danger-bg)", color: "var(--danger)", fontSize: 12, fontWeight: 700, padding: "7px 14px", borderRadius: 9999, border: "1px solid var(--danger)", cursor: "pointer", opacity: loadingId === b.id ? 0.6 : 1 }}>
                    Decline
                  </button>
                </div>
              )}
              <span style={{ color: "var(--text-muted)", fontSize: 16, flexShrink: 0 }}>›</span>
            </div>
          ))}
        </div>
      )}

      {/* Booking detail modal */}
      <Modal open={!!selected} onClose={() => setSelected(null)} title={selected?.venue_name}
        footer={selected?.status === "pending" ? (
          <>
            <Button variant="danger" onClick={() => handleAction(selected.id, "decline")} loading={loadingId === selected.id}>Decline</Button>
            <Button onClick={() => handleAction(selected.id, "approve")} loading={loadingId === selected.id}>Approve booking</Button>
          </>
        ) : undefined}
      >
        {selected && (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div style={{ padding: "14px 16px", background: "var(--green-light)", borderRadius: "var(--r-md)", border: "1px solid var(--green-border)" }}>
              <p style={{ fontSize: 13, fontWeight: 600, color: "var(--green-dark)", marginBottom: 2 }}>Event date</p>
              <p style={{ fontSize: 16, fontWeight: 700, color: "var(--green-dark)" }}>{fmt(selected.event_date)}</p>
            </div>
            {[
              { label: "Contact name", value: selected.venue_contact_name },
              { label: "Contact email", value: selected.venue_contact_email },
              { label: "Contact phone", value: selected.venue_contact_phone },
              { label: "Event details", value: selected.event_details },
            ].filter(f => f.value).map(f => (
              <div key={f.label}>
                <p style={{ fontSize: 12, fontWeight: 700, color: "var(--text-3)", textTransform: "uppercase", letterSpacing: ".06em", marginBottom: 4 }}>{f.label}</p>
                <p style={{ fontSize: 14, color: "var(--text)" }}>{f.value}</p>
              </div>
            ))}
            <div style={{ padding: "12px 16px", background: "var(--dark-2)", borderRadius: "var(--r-md)" }}>
              <p style={{ fontSize: 12, color: "var(--text-on-dark-3)" }}>Status: <span style={{ color: selected.status === "approved" ? "var(--green)" : selected.status === "declined" ? "var(--danger)" : "var(--warning)", fontWeight: 700 }}>{selected.status}</span></p>
              {selected.status === "pending" && <p style={{ fontSize: 12, color: "var(--text-on-dark-3)", marginTop: 4 }}>Approving will automatically add this to your schedule.</p>}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
