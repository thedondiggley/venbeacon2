"use client";

import { useState } from "react";

const EVENT_TYPES = [
  { value: "brewery", label: "Brewery" },
  { value: "apartment", label: "Apartment community" },
  { value: "office", label: "Office park" },
  { value: "festival", label: "Festival" },
  { value: "school", label: "School" },
  { value: "private", label: "Private event" },
  { value: "other", label: "Other" },
];

const inputStyle = {
  borderColor: "var(--brand-line)",
};

export function BookingForm({ vendorId }: { vendorId: string }) {
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    const form = e.currentTarget;
    const data = new FormData(form);

    const payload = {
      vendorId,
      venueName: data.get("venueName"),
      contactName: data.get("contactName"),
      contactEmail: data.get("contactEmail"),
      contactPhone: data.get("contactPhone"),
      eventDate: data.get("eventDate"),
      startTime: data.get("startTime"),
      endTime: data.get("endTime"),
      venueAddress: data.get("venueAddress"),
      eventType: data.get("eventType"),
      expectedAttendance: data.get("expectedAttendance"),
      notes: data.get("notes"),
    };

    setSubmitting(true);

    try {
      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? "Something went wrong. Please try again.");
      }

      setSubmitted(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  if (submitted) {
    return (
      <div
        className="rounded-lg p-4 text-sm"
        style={{ background: "var(--brand-green-light)", color: "var(--brand-green-dark)" }}
      >
        Thanks! Your request has been sent. The vendor will follow up by email if they can make it.
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Field label="Venue or business name" name="venueName" required />
        <Field label="Event type" name="eventType" type="select" required />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Field label="Your name" name="contactName" required />
        <Field label="Your email" name="contactEmail" type="email" required />
      </div>

      <Field label="Phone (optional)" name="contactPhone" type="tel" />

      <Field label="Event address" name="venueAddress" required />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <Field label="Date" name="eventDate" type="date" required />
        <Field label="Start time" name="startTime" type="time" required />
        <Field label="End time" name="endTime" type="time" required />
      </div>

      <Field
        label="Expected attendance (optional)"
        name="expectedAttendance"
        placeholder="e.g. 50-100"
      />

      <Field label="Anything else? (optional)" name="notes" type="textarea" />

      {error && <p className="text-sm" style={{ color: "#A32D2D" }}>{error}</p>}

      <button
        type="submit"
        disabled={submitting}
        className="rounded-lg px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
        style={{ background: "var(--brand-green)" }}
      >
        {submitting ? "Sending..." : "Send request"}
      </button>
    </form>
  );
}

function Field({
  label,
  name,
  type = "text",
  required = false,
  placeholder,
}: {
  label: string;
  name: string;
  type?: string;
  required?: boolean;
  placeholder?: string;
}) {
  const baseClass =
    "w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2";

  if (type === "select") {
    return (
      <div>
        <label className="block text-sm font-medium mb-1.5">{label}</label>
        <select name={name} required={required} className={baseClass} style={inputStyle} defaultValue="">
          <option value="" disabled>
            Select one
          </option>
          {EVENT_TYPES.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>
    );
  }

  if (type === "textarea") {
    return (
      <div>
        <label className="block text-sm font-medium mb-1.5">{label}</label>
        <textarea
          name={name}
          rows={3}
          placeholder={placeholder}
          className={baseClass}
          style={inputStyle}
        />
      </div>
    );
  }

  return (
    <div>
      <label className="block text-sm font-medium mb-1.5">{label}</label>
      <input
        type={type}
        name={name}
        required={required}
        placeholder={placeholder}
        className={baseClass}
        style={inputStyle}
      />
    </div>
  );
}
