"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const VENUE_TYPES = [
  { value: "brewery", label: "Brewery / taproom" },
  { value: "apartment", label: "Apartment community" },
  { value: "office", label: "Office park" },
  { value: "shopping", label: "Shopping center" },
  { value: "park", label: "Park / outdoor space" },
  { value: "public_space", label: "Public space / street / parking lot" },
  { value: "farmers_market", label: "Farmers market / festival grounds" },
  { value: "event_space", label: "Event space" },
  { value: "church", label: "Church / place of worship" },
  { value: "school", label: "School / university" },
  { value: "private", label: "Private property" },
  { value: "other", label: "Other" },
];

const PUBLIC_SPACE_TYPES = ["park", "public_space", "farmers_market"];

export function AdminAddVenueForm() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [venueName, setVenueName] = useState("");
  const [venueType, setVenueType] = useState("park");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("Chattanooga");
  const [zipCode, setZipCode] = useState("");
  const [daysAvailable, setDaysAvailable] = useState("");
  const [hoursAvailable, setHoursAvailable] = useState("");
  const [description, setDescription] = useState("");
  const [maxTrucks, setMaxTrucks] = useState("1");
  const [hasElectrical, setHasElectrical] = useState(false);
  const [hasWater, setHasWater] = useState(false);
  const [hasRestrooms, setHasRestrooms] = useState(false);
  const [contactName, setContactName] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [websiteUrl, setWebsiteUrl] = useState("");

  const isPublicSpace = PUBLIC_SPACE_TYPES.includes(venueType);

  const inputCls = "w-full rounded-lg border px-3 py-2.5 text-sm focus:outline-none focus:ring-2";
  const inputStyle = { borderColor: "var(--brand-line)" };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      const res = await fetch("/api/venue-listings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          venueName, venueType, address, city, zipCode,
          daysAvailable, hoursAvailable, description,
          maxTrucks, hasElectrical, hasWater, hasRestrooms,
          contactName, contactEmail, contactPhone,
          websiteUrl,
          isPublicSpace,
          turnstileToken: "admin-bypass",
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Submission failed");

      // Auto-approve and publish since this is admin-submitted
      await fetch("/api/admin/venues", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: data.id, is_approved: true, is_published: true }),
      });

      router.push("/admin?tab=venues");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-2">
          <label className="block text-sm font-medium mb-1.5">Venue name *</label>
          <input type="text" value={venueName} onChange={e => setVenueName(e.target.value)} required
            placeholder="Coolidge Park" className={inputCls} style={inputStyle} />
        </div>
        <div className="col-span-2 sm:col-span-1">
          <label className="block text-sm font-medium mb-1.5">Type *</label>
          <select value={venueType} onChange={e => setVenueType(e.target.value)} className={inputCls} style={inputStyle}>
            {VENUE_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
          </select>
        </div>
        <div className="col-span-2 sm:col-span-1">
          <label className="block text-sm font-medium mb-1.5">Max trucks</label>
          <input type="number" value={maxTrucks} onChange={e => setMaxTrucks(e.target.value)} min="1"
            className={inputCls} style={inputStyle} />
        </div>
        <div className="col-span-2">
          <label className="block text-sm font-medium mb-1.5">Address *</label>
          <input type="text" value={address} onChange={e => setAddress(e.target.value)} required
            placeholder="150 River St" className={inputCls} style={inputStyle} />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1.5">City *</label>
          <input type="text" value={city} onChange={e => setCity(e.target.value)} required
            className={inputCls} style={inputStyle} />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1.5">ZIP</label>
          <input type="text" value={zipCode} onChange={e => setZipCode(e.target.value)}
            className={inputCls} style={inputStyle} />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1.5">Days available *</label>
          <input type="text" value={daysAvailable} onChange={e => setDaysAvailable(e.target.value)} required
            placeholder="Mon–Sun" className={inputCls} style={inputStyle} />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1.5">Hours *</label>
          <input type="text" value={hoursAvailable} onChange={e => setHoursAvailable(e.target.value)} required
            placeholder="6am–10pm" className={inputCls} style={inputStyle} />
        </div>
        <div className="col-span-2">
          <label className="block text-sm font-medium mb-1.5">Description *</label>
          <textarea value={description} onChange={e => setDescription(e.target.value)} required rows={3}
            placeholder="Brief description of the space..." className={inputCls} style={inputStyle} />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">Amenities</label>
        <div className="flex gap-4">
          {[
            { label: "Electrical", val: hasElectrical, set: setHasElectrical },
            { label: "Water", val: hasWater, set: setHasWater },
            { label: "Restrooms", val: hasRestrooms, set: setHasRestrooms },
          ].map(({ label, val, set }) => (
            <label key={label} className="flex items-center gap-2 text-sm cursor-pointer">
              <input type="checkbox" checked={val} onChange={e => set(e.target.checked)} />
              {label}
            </label>
          ))}
        </div>
      </div>

      {/* Contact info — optional for public spaces */}
      <div>
        <label className="block text-sm font-medium mb-2">
          Contact info {isPublicSpace ? <span style={{ color: "var(--brand-charcoal-soft)", fontWeight: 400 }}>(optional for public spaces)</span> : "*"}
        </label>
        <div className="space-y-2">
          <input type="text" value={contactName} onChange={e => setContactName(e.target.value)}
            placeholder="Contact name" className={inputCls} style={inputStyle} />
          <input type="email" value={contactEmail} onChange={e => setContactEmail(e.target.value)}
            placeholder="Contact email" className={inputCls} style={inputStyle} />
          <input type="tel" value={contactPhone} onChange={e => setContactPhone(e.target.value)}
            placeholder="Contact phone" className={inputCls} style={inputStyle} />
          <input type="url" value={websiteUrl} onChange={e => setWebsiteUrl(e.target.value)}
            placeholder="Website (optional)" className={inputCls} style={inputStyle} />
        </div>
      </div>

      {isPublicSpace && (
        <div className="rounded-lg p-3 text-sm" style={{ background: "var(--brand-green-light)", color: "var(--brand-green-dark)" }}>
          📍 Public space — will skip email verification and auto-approve on submit.
        </div>
      )}

      {error && <p className="text-sm" style={{ color: "#A32D2D" }}>{error}</p>}

      <button type="submit" disabled={submitting}
        className="w-full rounded-xl py-3 text-sm font-semibold text-white disabled:opacity-60"
        style={{ background: "var(--brand-green)" }}>
        {submitting ? "Submitting..." : isPublicSpace ? "Add & approve listing" : "Add listing"}
      </button>
    </form>
  );
}
