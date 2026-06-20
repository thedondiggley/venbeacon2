"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

const FOOD_TYPES = [
  "American", "BBQ", "Breakfast / Brunch", "Burgers", "Caribbean", "Chinese",
  "Coffee / Drinks", "Desserts / Ice Cream", "Greek / Mediterranean", "Hot Dogs",
  "Indian", "Italian / Pizza", "Japanese", "Korean", "Latin American",
  "Mexican / Tacos", "Pizza", "Sandwiches / Wraps", "Seafood", "Soul Food",
  "Southern", "Thai", "Vegan / Vegetarian", "Wings", "Other"
];

type Vendor = {
  id: string;
  business_name: string;
  slug: string;
  description: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  instagram_url: string | null;
  facebook_url: string | null;
  tiktok_url: string | null;
  logo_url: string | null;
  owner_name: string | null;
  food_type: string | null;
  service_areas: string | null;
  website_url: string | null;
  power_needs: string | null;
  water_needs: boolean;
  insurance_info: string | null;
};

export function SettingsForm({ vendor }: { vendor: Vendor }) {
  const supabase = createClient();
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [logoUploading, setLogoUploading] = useState(false);

  const [businessName, setBusinessName] = useState(vendor.business_name ?? "");
  const [ownerName, setOwnerName] = useState(vendor.owner_name ?? "");
  const [description, setDescription] = useState(vendor.description ?? "");
  const [phone, setPhone] = useState(vendor.contact_phone ?? "");
  const [foodType, setFoodType] = useState(vendor.food_type ?? "");
  const [serviceAreas, setServiceAreas] = useState(vendor.service_areas ?? "");
  const [websiteUrl, setWebsiteUrl] = useState(vendor.website_url ?? "");
  const [instagram, setInstagram] = useState(vendor.instagram_url ?? "");
  const [facebook, setFacebook] = useState(vendor.facebook_url ?? "");
  const [tiktok, setTiktok] = useState(vendor.tiktok_url ?? "");
  const [powerNeeds, setPowerNeeds] = useState(vendor.power_needs ?? "");
  const [waterNeeds, setWaterNeeds] = useState(vendor.water_needs ?? false);
  const [insuranceInfo, setInsuranceInfo] = useState(vendor.insurance_info ?? "");
  const [logoUrl, setLogoUrl] = useState(vendor.logo_url ?? "");

  async function handleLogoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) { setError("Logo must be under 5MB."); return; }
    if (!["image/jpeg", "image/png", "image/webp", "image/gif"].includes(file.type)) {
      setError("Logo must be a JPEG, PNG, WebP, or GIF."); return;
    }

    setLogoUploading(true);
    setError(null);
    const form = new FormData();
    form.append("file", file);
    try {
      const res = await fetch("/api/upload-logo", { method: "POST", body: form });
      if (!res.ok) throw new Error("Upload failed.");
      const data = await res.json();
      setLogoUrl(data.url);
    } catch {
      setError("Logo upload failed. Please try again.");
    } finally {
      setLogoUploading(false);
    }
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSaved(false);

    if (!businessName.trim()) { setError("Business name is required."); setSaving(false); return; }

    const { error: updateError } = await supabase.from("vendors").update({
      business_name: businessName,
      owner_name: ownerName || null,
      description: description || null,
      contact_phone: phone || null,
      food_type: foodType || null,
      service_areas: serviceAreas || null,
      website_url: websiteUrl || null,
      instagram_url: instagram || null,
      facebook_url: facebook || null,
      tiktok_url: tiktok || null,
      power_needs: powerNeeds || null,
      water_needs: waterNeeds,
      insurance_info: insuranceInfo || null,
      logo_url: logoUrl || null,
      updated_at: new Date().toISOString(),
    }).eq("id", vendor.id);

    if (updateError) { setError(updateError.message); } else { setSaved(true); }
    setSaving(false);
  }

  const inputCls = "w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2";
  const inputStyle = { borderColor: "var(--brand-line)" };

  return (
    <form onSubmit={handleSave} className="space-y-6">
      <h2 className="text-base font-medium">Business profile</h2>

      {/* Logo */}
      <div>
        <label className="block text-sm font-medium mb-2">Logo</label>
        <div className="flex items-center gap-4">
          {logoUrl ? (
            <img src={logoUrl} alt="Business logo" className="w-16 h-16 rounded-xl object-cover border" style={{ borderColor: "var(--brand-line)" }} />
          ) : (
            <div className="w-16 h-16 rounded-xl flex items-center justify-center border text-2xl" style={{ borderColor: "var(--brand-line)", background: "var(--brand-green-light)" }}>🚚</div>
          )}
          <div>
            <label className="cursor-pointer text-sm font-medium underline" style={{ color: "var(--brand-green-dark)" }}>
              {logoUploading ? "Uploading..." : logoUrl ? "Change logo" : "Upload logo"}
              <input type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" disabled={logoUploading} />
            </label>
            <p className="text-xs mt-0.5" style={{ color: "var(--brand-charcoal-soft)" }}>JPEG, PNG, WebP · Max 5MB</p>
          </div>
        </div>
      </div>

      {/* Business info */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1.5">Business name <span style={{ color: "#A32D2D" }}>*</span></label>
          <input type="text" value={businessName} onChange={e => setBusinessName(e.target.value)} className={inputCls} style={inputStyle} />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1.5">Owner / operator name</label>
          <input type="text" value={ownerName} onChange={e => setOwnerName(e.target.value)} placeholder="Your full name" className={inputCls} style={inputStyle} />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1.5">Food type / cuisine</label>
        <select value={foodType} onChange={e => setFoodType(e.target.value)} className={inputCls} style={inputStyle}>
          <option value="">Select a category</option>
          {FOOD_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1.5">Description</label>
        <textarea rows={3} value={description} onChange={e => setDescription(e.target.value)}
          placeholder="Describe your food truck — cuisine type, specialties, what makes you unique."
          className={inputCls} style={inputStyle} />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1.5">Service areas</label>
        <input type="text" value={serviceAreas} onChange={e => setServiceAreas(e.target.value)}
          placeholder="e.g. Chattanooga TN, North Georgia, Dalton GA"
          className={inputCls} style={inputStyle} />
        <p className="text-xs mt-1" style={{ color: "var(--brand-charcoal-soft)" }}>Cities and areas you serve, separated by commas</p>
      </div>

      {/* Contact */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1.5">Phone number</label>
          <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder="(423) 555-0000" className={inputCls} style={inputStyle} />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1.5">Website</label>
          <input type="url" value={websiteUrl} onChange={e => setWebsiteUrl(e.target.value)} placeholder="https://yourtruck.com" className={inputCls} style={inputStyle} />
        </div>
      </div>

      {/* Social links */}
      <div>
        <label className="block text-sm font-medium mb-2">Social links</label>
        <div className="space-y-2">
          {[
            { label: "Instagram", value: instagram, setter: setInstagram, placeholder: "https://instagram.com/yourtruck" },
            { label: "Facebook", value: facebook, setter: setFacebook, placeholder: "https://facebook.com/yourtruck" },
            { label: "TikTok", value: tiktok, setter: setTiktok, placeholder: "https://tiktok.com/@yourtruck" },
          ].map(({ label, value, setter, placeholder }) => (
            <div key={label} className="flex items-center gap-2">
              <span className="text-xs w-20 shrink-0" style={{ color: "var(--brand-charcoal-soft)" }}>{label}</span>
              <input type="url" value={value} onChange={e => setter(e.target.value)} placeholder={placeholder} className={inputCls} style={inputStyle} />
            </div>
          ))}
        </div>
      </div>

      {/* Operational needs */}
      <div>
        <label className="block text-sm font-medium mb-2">Operational needs</label>
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-medium mb-1" style={{ color: "var(--brand-charcoal-soft)" }}>Power needs</label>
            <input type="text" value={powerNeeds} onChange={e => setPowerNeeds(e.target.value)}
              placeholder="e.g. 110v 20amp outlet required" className={inputCls} style={inputStyle} />
          </div>
          <div className="flex items-center gap-3">
            <button type="button" onClick={() => setWaterNeeds(!waterNeeds)}
              className="w-5 h-5 rounded border-2 flex items-center justify-center"
              style={{ borderColor: waterNeeds ? "var(--brand-green)" : "var(--brand-line)", background: waterNeeds ? "var(--brand-green)" : "#fff" }}>
              {waterNeeds && <span style={{ color: "#fff", fontSize: "10px" }}>✓</span>}
            </button>
            <span className="text-sm">Water hookup required</span>
          </div>
          <div>
            <label className="block text-xs font-medium mb-1" style={{ color: "var(--brand-charcoal-soft)" }}>Insurance / permit info</label>
            <input type="text" value={insuranceInfo} onChange={e => setInsuranceInfo(e.target.value)}
              placeholder="e.g. $1M general liability, city health permit" className={inputCls} style={inputStyle} />
          </div>
        </div>
      </div>

      {error && <p className="text-sm" style={{ color: "#A32D2D" }}>{error}</p>}
      {saved && <p className="text-sm" style={{ color: "var(--brand-green-dark)" }}>Profile saved successfully.</p>}

      <button type="submit" disabled={saving}
        className="rounded-lg px-5 py-2.5 text-sm font-medium text-white disabled:opacity-60"
        style={{ background: "var(--brand-green)" }}>
        {saving ? "Saving..." : "Save profile"}
      </button>
    </form>
  );
}
