"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export type Booking = {
  id: string;
  vendor_id: string;
  venue_name: string;
  contact_name: string;
  contact_email: string;
  contact_phone: string | null;
  event_date: string;
  start_time: string;
  end_time: string;
  venue_address: string;
  event_type: string;
  expected_attendance: string | null;
  notes: string | null;
  status: "pending" | "approved" | "declined";
  created_at: string;
};

const EVENT_TYPE_LABELS: Record<string, string> = {
  brewery: "Brewery", apartment: "Apartment", office: "Office park",
  festival: "Festival", school: "School", private: "Private event", other: "Other",
};

function formatDate(d: string) {
  return new Date(d + "T12:00:00").toLocaleDateString(undefined, {
    weekday: "short", month: "short", day: "numeric", year: "numeric",
  });
}

function formatTime(t: string) {
  const [h, m] = t.split(":").map(Number);
  const ap = h >= 12 ? "PM" : "AM";
  const h12 = h > 12 ? h - 12 : h === 0 ? 12 : h;
  return `${h12}:${m.toString().padStart(2, "0")} ${ap}`;
}

function BookingCard({
  booking, onApprove, onDecline, onDelete,
}: {
  booking: Booking;
  onApprove?: () => Promise<void>;
  onDecline?: () => Promise<void>;
  onDelete?: () => Promise<void>;
}) {
  const [loading, setLoading] = useState<string | null>(null);

  async function handle(action: string, fn: () => Promise<void>) {
    setLoading(action);
    await fn();
    setLoading(null);
  }

  return (
    <div className="rounded-xl border p-4" style={{ borderColor: "var(--brand-line)" }}>
      <div className="flex items-start justify-between gap-3 mb-3">
        <div>
          <div className="font-medium text-sm">{booking.venue_name}</div>
          <div className="text-xs mt-0.5" style={{ color: "var(--brand-charcoal-soft)" }}>
            {EVENT_TYPE_LABELS[booking.event_type] ?? booking.event_type}
          </div>
        </div>
        <span className="text-xs px-2 py-0.5 rounded-full shrink-0 font-medium"
          style={{
            background: booking.status === "approved" ? "var(--brand-green-light)" : booking.status === "declined" ? "#FEE2E2" : "#FEF9C3",
            color: booking.status === "approved" ? "var(--brand-green-dark)" : booking.status === "declined" ? "#991B1B" : "#854D0E",
          }}>
          {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
        </span>
      </div>

      <div className="space-y-1 mb-3">
        <p className="text-sm font-medium">📅 {formatDate(booking.event_date)}</p>
        <p className="text-sm" style={{ color: "var(--brand-charcoal-soft)" }}>
          🕐 {formatTime(booking.start_time)} – {formatTime(booking.end_time)}
        </p>
        <p className="text-sm" style={{ color: "var(--brand-charcoal-soft)" }}>
          📍 {booking.venue_address}
        </p>
        {booking.expected_attendance && (
          <p className="text-sm" style={{ color: "var(--brand-charcoal-soft)" }}>
            👥 {booking.expected_attendance} expected
          </p>
        )}
      </div>

      <div className="border-t pt-3 mb-3" style={{ borderColor: "var(--brand-line)" }}>
        <p className="text-xs font-semibold mb-1" style={{ color: "var(--brand-charcoal-soft)" }}>CONTACT</p>
        <p className="text-sm">{booking.contact_name}</p>
        <a href={`mailto:${booking.contact_email}`} className="text-sm underline block"
          style={{ color: "var(--brand-green-dark)" }}>{booking.contact_email}</a>
        {booking.contact_phone && (
          <a href={`tel:${booking.contact_phone}`} className="text-sm underline block"
            style={{ color: "var(--brand-green-dark)" }}>{booking.contact_phone}</a>
        )}
      </div>

      {booking.notes && (
        <p className="text-sm italic mb-3 pb-3 border-b"
          style={{ color: "var(--brand-charcoal-soft)", borderColor: "var(--brand-line)" }}>
          &quot;{booking.notes}&quot;
        </p>
      )}

      {booking.status === "pending" && onApprove && onDecline && (
        <div className="flex gap-2">
          <button onClick={() => handle("approve", onApprove)}
            disabled={loading !== null}
            className="flex-1 rounded-lg py-2 text-sm font-medium text-white disabled:opacity-60"
            style={{ background: "var(--brand-green)" }}>
            {loading === "approve" ? "Approving..." : "Approve"}
          </button>
          <button onClick={() => handle("decline", onDecline)}
            disabled={loading !== null}
            className="flex-1 rounded-lg py-2 text-sm font-medium border disabled:opacity-60"
            style={{ borderColor: "var(--brand-line)", color: "var(--brand-charcoal)" }}>
            {loading === "decline" ? "Declining..." : "Decline"}
          </button>
        </div>
      )}

      {booking.status === "declined" && onDelete && (
        <button onClick={() => handle("delete", onDelete)}
          disabled={loading !== null}
          className="text-sm underline disabled:opacity-60"
          style={{ color: "#A32D2D" }}>
          {loading === "delete" ? "Deleting..." : "Delete request"}
        </button>
      )}
    </div>
  );
}

type Tab = "pending" | "approved" | "declined";

export function BookingsList({
  vendorId,
  initialBookings,
}: {
  vendorId: string;
  initialBookings: Booking[];
}) {
  const [bookings, setBookings] = useState<Booking[]>(initialBookings);
  const [activeTab, setActiveTab] = useState<Tab>("pending");
  const supabase = createClient();

  const pending = bookings.filter(b => b.status === "pending");
  const approved = bookings.filter(b => b.status === "approved");
  const declined = bookings.filter(b => b.status === "declined");

  const tabCounts: Record<Tab, number> = {
    pending: pending.length,
    approved: approved.length,
    declined: declined.length,
  };

  const tabList: { key: Tab; label: string }[] = [
    { key: "pending", label: "Pending" },
    { key: "approved", label: "Approved" },
    { key: "declined", label: "Declined" },
  ];

  async function approve(id: string) {
    const booking = bookings.find(b => b.id === id);
    if (!booking) return;

    await supabase.from("bookings").update({ status: "approved" }).eq("id", id);

    await supabase.from("locations").insert({
      vendor_id: vendorId,
      title: booking.venue_name,
      address: booking.venue_address,
      start_time: `${booking.event_date}T${booking.start_time}:00`,
      end_time: `${booking.event_date}T${booking.end_time}:00`,
      notes: booking.notes ?? null,
      source: "booking",
      booking_id: id,
    });

    await fetch("/api/bookings/notify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ bookingId: id, action: "approved" }),
    }).catch(() => {});

    setBookings(prev => prev.map(b => b.id === id ? { ...b, status: "approved" as const } : b));
  }

  async function decline(id: string) {
    await supabase.from("bookings").update({ status: "declined" }).eq("id", id);

    await fetch("/api/bookings/notify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ bookingId: id, action: "declined" }),
    }).catch(() => {});

    setBookings(prev => prev.map(b => b.id === id ? { ...b, status: "declined" as const } : b));
  }

  async function deleteBooking(id: string) {
    await supabase.from("bookings").delete().eq("id", id);
    setBookings(prev => prev.filter(b => b.id !== id));
  }

  const current = activeTab === "pending" ? pending : activeTab === "approved" ? approved : declined;

  if (bookings.length === 0) {
    return (
      <div className="rounded-xl border p-6 text-center" style={{ borderColor: "var(--brand-line)" }}>
        <p className="text-sm font-medium">No booking requests yet.</p>
        <p className="text-sm mt-2" style={{ color: "var(--brand-charcoal-soft)" }}>
          Once you share your public page link, venues and event organizers can submit booking requests here.
          You'll get an email notification each time one comes in.
        </p>
      </div>
    );
  }

  return (
    <div>
      {/* Tabs */}
      <div className="flex border-b mb-5" style={{ borderColor: "var(--brand-line)" }}>
        {tabList.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className="flex items-center gap-1.5 px-4 py-2.5 text-sm border-b-2 transition"
            style={{
              borderColor: activeTab === tab.key ? "var(--brand-green)" : "transparent",
              color: activeTab === tab.key ? "var(--brand-charcoal)" : "var(--brand-charcoal-soft)",
              fontWeight: activeTab === tab.key ? 500 : 400,
              background: "none",
            }}>
            {tab.label}
            {tabCounts[tab.key] > 0 && (
              <span className="text-xs font-bold px-1.5 py-0.5 rounded-full"
                style={{
                  background: tab.key === "pending" ? "var(--brand-green)" : tab.key === "declined" ? "#FEE2E2" : "var(--brand-green-light)",
                  color: tab.key === "pending" ? "#fff" : tab.key === "declined" ? "#991B1B" : "var(--brand-green-dark)",
                }}>
                {tabCounts[tab.key]}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {current.length === 0 ? (
        <div className="rounded-xl border p-6 text-center" style={{ borderColor: "var(--brand-line)" }}>
          <p className="text-sm" style={{ color: "var(--brand-charcoal-soft)" }}>
            No {activeTab} requests.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {current.map(b => (
            <BookingCard
              key={b.id}
              booking={b}
              onApprove={b.status === "pending" ? () => approve(b.id) : undefined}
              onDecline={b.status === "pending" ? () => decline(b.id) : undefined}
              onDelete={b.status === "declined" ? () => deleteBooking(b.id) : undefined}
            />
          ))}
        </div>
      )}
    </div>
  );
}
