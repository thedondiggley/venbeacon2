"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button, Input, Textarea, Select, Checkbox, useToast, Section, Divider } from "@/components/ui";
import { handleToUrl, urlToHandle } from "@/lib/social-handles";
import type { Vendor } from "@/lib/vendor";

export function SettingsForm({ vendor }: { vendor: Vendor }) {
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);

  const [businessName, setBusinessName] = useState(vendor.business_name ?? "");
  const [ownerName, setOwnerName] = useState(vendor.owner_name ?? "");
  const [description, setDescription] = useState(vendor.description ?? "");
  const [phone, setPhone] = useState(vendor.contact_phone ?? "");
  const [foodType, setFoodType] = useState(vendor.food_type ?? "");
  const [serviceAreas, setServiceAreas] = useState(vendor.service_areas ?? "");
  const [websiteUrl, setWebsiteUrl] = useState(vendor.website_url ?? "");
  const [instagram, setInstagram] = useState(urlToHandle("instagram", vendor.instagram_url));
  const [facebook, setFacebook] = useState(urlToHandle("facebook", vendor.facebook_url));
  const [tiktok, setTiktok] = useState(urlToHandle("tiktok", vendor.tiktok_url));
  const [powerNeeds, setPowerNeeds] = useState(vendor.power_needs ?? "");
  const [waterNeeds, setWaterNeeds] = useState(vendor.water_needs ?? false);
  const [insuranceInfo, setInsuranceInfo] = useState(vendor.insurance_info ?? "");
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState(vendor.logo_url ?? "");
  const [uploadingLogo, setUploadingLogo] = useState(false);

  function handleLogoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setLogoFile(file);
    setLogoPreview(URL.createObjectURL(file));
  }

  async function handleSave() {
    setSaving(true);
    try {
      const supabase = createClient();
      let logoUrl = vendor.logo_url;

      if (logoFile) {
        setUploadingLogo(true);
        const formData = new FormData();
        formData.append("file", logoFile);
        const res = await fetch("/api/upload-logo", { method: "POST", body: formData });
        const data = await res.json();
        if (res.ok && data.url) logoUrl = data.url;
        setUploadingLogo(false);
      }

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { error } = await supabase.from("vendors").update({
        business_name: businessName,
        owner_name: ownerName || null,
        description: description || null,
        contact_phone: phone || null,
        food_type: foodType || null,
        service_areas: serviceAreas || null,
        website_url: websiteUrl || null,
        instagram_url: handleToUrl("instagram", instagram),
        facebook_url: handleToUrl("facebook", facebook),
        tiktok_url: handleToUrl("tiktok", tiktok),
        power_needs: powerNeeds || null,
        water_needs: waterNeeds,
        insurance_info: insuranceInfo || null,
        logo_url: logoUrl,
      }).eq("user_id", user.id);

      if (error) throw error;
      toast("Profile saved");
    } catch (err) {
      toast(err instanceof Error ? err.message : "Failed to save", "error");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 32 }}>

      {/* Logo */}
      <Section title="Logo">
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div style={{
            width: 72, height: 72, borderRadius: "var(--r-lg)",
            background: logoPreview ? "transparent" : "var(--green-light)",
            border: "1px solid var(--border-2)",
            overflow: "hidden", flexShrink: 0,
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            {logoPreview ? (
              <img src={logoPreview} alt="Logo" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            ) : (
              <span style={{ fontSize: 28 }}>🚚</span>
            )}
          </div>
          <div>
            <label style={{
              display: "inline-flex", alignItems: "center", gap: 6,
              fontSize: 13, fontWeight: 600, color: "var(--green-mid)",
              cursor: "pointer", padding: "8px 14px",
              border: "1px solid var(--green-border)", borderRadius: "var(--r-full)",
              background: "var(--green-light)",
            }}>
              {uploadingLogo ? "Uploading..." : "Change logo"}
              <input type="file" accept="image/*" onChange={handleLogoChange} style={{ display: "none" }} />
            </label>
            <p style={{ fontSize: 12, color: "var(--text-3)", marginTop: 6 }}>PNG, JPG up to 5MB. Square images look best.</p>
          </div>
        </div>
      </Section>

      <Divider />

      {/* Business info */}
      <Section title="Business info">
        <Input label="Business name" value={businessName} onChange={e => setBusinessName(e.target.value)} placeholder="Big Dawg Dogs" required />
        <Input label="Owner name" value={ownerName} onChange={e => setOwnerName(e.target.value)} placeholder="Your full name" hint="Shown to venues when you contact them" />
        <Textarea label="Description" value={description} onChange={e => setDescription(e.target.value)} placeholder="Tell venues and customers about your truck — food style, vibe, what makes you stand out." style={{ minHeight: 100 }} />
        <Input label="Food type / cuisine" value={foodType} onChange={e => setFoodType(e.target.value)} placeholder="BBQ, Tacos, Burgers, etc." />
        <Input label="Service areas" value={serviceAreas} onChange={e => setServiceAreas(e.target.value)} placeholder="Chattanooga, Rossville, North Georgia" hint="Where you typically operate" />
      </Section>

      <Divider />

      {/* Contact */}
      <Section title="Contact and links">
        <Input label="Public phone number" value={phone} onChange={e => setPhone(e.target.value)} placeholder="(423) 555-0000" type="tel" hint="Shown on your public page so customers and venues can call you" />
        <Input label="Website" value={websiteUrl} onChange={e => setWebsiteUrl(e.target.value)} placeholder="https://yourtruck.com" type="url" />

        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <p style={{ fontSize: 13, fontWeight: 600, color: "var(--text-2)" }}>Social links</p>
          <p style={{ fontSize: 12, color: "var(--text-3)", marginTop: -6 }}>Just your username — we build the link for you.</p>
          {[
            { label: "Instagram", value: instagram, setter: setInstagram, prefix: "instagram.com/" },
            { label: "Facebook", value: facebook, setter: setFacebook, prefix: "facebook.com/" },
            { label: "TikTok", value: tiktok, setter: setTiktok, prefix: "tiktok.com/@" },
          ].map(({ label, value, setter, prefix }) => (
            <div key={label} style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: 12, fontWeight: 600, color: "var(--text-3)", width: 70, flexShrink: 0 }}>{label}</span>
              <div style={{ flex: 1, position: "relative" }}>
                {!value.startsWith("http") && (
                  <span style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", fontSize: 14, color: "var(--text-3)", pointerEvents: "none" }}>@</span>
                )}
                <input
                  value={value}
                  onChange={e => setter(e.target.value)}
                  placeholder="yourtruck"
                  style={{
                    width: "100%", height: 44, borderRadius: "var(--r-md)",
                    border: "1px solid var(--border-2)", background: "var(--surface)",
                    color: "var(--text)", fontSize: 14, fontFamily: "inherit",
                    padding: !value.startsWith("http") ? "0 14px 0 28px" : "0 14px",
                    outline: "none",
                  }}
                  onFocus={e => { e.currentTarget.style.borderColor = "var(--green)"; e.currentTarget.style.boxShadow = "0 0 0 3px rgba(57,255,20,0.15)"; }}
                  onBlur={e => { e.currentTarget.style.borderColor = "var(--border-2)"; e.currentTarget.style.boxShadow = "none"; }}
                />
              </div>
            </div>
          ))}
        </div>
      </Section>

      <Divider />

      {/* Operational */}
      <Section title="Operational needs" description="Venues use this to check compatibility before reaching out">
        <Input label="Power needs" value={powerNeeds} onChange={e => setPowerNeeds(e.target.value)} placeholder="30 amp, 20 amp, generator, none" />
        <Checkbox label="Requires water hookup" checked={waterNeeds} onChange={e => setWaterNeeds(e.target.checked)} />
        <Input label="Insurance info" value={insuranceInfo} onChange={e => setInsuranceInfo(e.target.value)} placeholder="$1M general liability, certificate on request" hint="Helps venues quickly confirm your coverage" />
      </Section>

      <Button onClick={handleSave} loading={saving} size="lg" fullWidth>
        Save changes
      </Button>

    </div>
  );
}
