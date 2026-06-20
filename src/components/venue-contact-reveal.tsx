"use client";

import { useState } from "react";

export function VenueContactReveal({ venueId }: { venueId: string }) {
  const [contact, setContact] = useState<{
    contact_name: string;
    contact_email: string;
    contact_phone: string | null;
  } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function reveal() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/venue-listings/reveal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ venueId }),
      });
      if (res.status === 403) {
        setError("Upgrade to Pro to view venue contact info.");
        return;
      }
      if (!res.ok) throw new Error("Failed to load contact info.");
      const data = await res.json();
      setContact(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  if (error) {
    return (
      <div>
        <p className="text-sm mb-3" style={{ color: "#A32D2D" }}>{error}</p>
        {error.includes("Upgrade") && (
          <a href="/pricing"
            className="inline-block rounded-lg px-4 py-2 text-sm font-medium text-white"
            style={{ background: "var(--brand-green)" }}>
            Upgrade to Pro
          </a>
        )}
      </div>
    );
  }

  if (contact) {
    return (
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium w-16 shrink-0" style={{ color: "var(--brand-charcoal-soft)" }}>Name</span>
          <span className="text-sm">{contact.contact_name}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium w-16 shrink-0" style={{ color: "var(--brand-charcoal-soft)" }}>Email</span>
          <a href={`mailto:${contact.contact_email}`}
            className="text-sm underline"
            style={{ color: "var(--brand-green-dark)" }}>
            {contact.contact_email}
          </a>
        </div>
        {contact.contact_phone && (
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium w-16 shrink-0" style={{ color: "var(--brand-charcoal-soft)" }}>Phone</span>
            <a href={`tel:${contact.contact_phone}`}
              className="text-sm underline"
              style={{ color: "var(--brand-green-dark)" }}>
              {contact.contact_phone}
            </a>
          </div>
        )}
      </div>
    );
  }

  return (
    <button
      onClick={reveal}
      disabled={loading}
      className="rounded-lg px-4 py-2 text-sm font-medium border transition disabled:opacity-60"
      style={{
        borderColor: "var(--brand-green)",
        color: "var(--brand-green-dark)",
        background: "var(--brand-green-light)"
      }}>
      {loading ? "Loading..." : "Show contact info"}
    </button>
  );
}
