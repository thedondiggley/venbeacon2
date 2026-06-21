"use client";

import { useState, useRef, useEffect } from "react";
import Script from "next/script";
import { Logo } from "@/components/logo";
import { handleToUrl } from "@/lib/social-handles";

const VENUE_TYPES = [
  { value: "brewery", label: "Brewery / taproom" },
  { value: "apartment", label: "Apartment community" },
  { value: "office", label: "Office park" },
  { value: "shopping", label: "Shopping center" },
  { value: "park", label: "Park / outdoor space" },
  { value: "event_space", label: "Event space" },
  { value: "church", label: "Church / place of worship" },
  { value: "school", label: "School / university" },
  { value: "private", label: "Private property" },
  { value: "other", label: "Other" },
];

const TRAFFIC_OPTIONS = [
  { value: "low", label: "Low (under 50 people/day)" },
  { value: "medium", label: "Medium (50–200 people/day)" },
  { value: "high", label: "High (200–500 people/day)" },
  { value: "very_high", label: "Very high (500+ people/day)" },
];

const FEE_OPTIONS = [
  { value: "none", label: "No fee — free for vendors" },
  { value: "negotiable", label: "Negotiable — discuss with vendor" },
  { value: "flat", label: "Flat fee per day" },
  { value: "percentage", label: "Percentage of sales" },
];

const DAYS = ["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday"];
type DaySchedule = { enabled: boolean; open: string; close: string };
type Schedule = Record<string, DaySchedule>;

function formatSchedule(schedule: Schedule) {
  const fmt = (t: string) => {
    const [h, m] = t.split(":").map(Number);
    const ap = h >= 12 ? "pm" : "am";
    const h12 = h > 12 ? h - 12 : h === 0 ? 12 : h;
    return m === 0 ? `${h12}${ap}` : `${h12}:${m.toString().padStart(2,"0")}${ap}`;
  };
  const abbr: Record<string,string> = {Monday:"Mon",Tuesday:"Tue",Wednesday:"Wed",Thursday:"Thu",Friday:"Fri",Saturday:"Sat",Sunday:"Sun"};
  const active = DAYS.filter(d => schedule[d].enabled);
  if (!active.length) return { days: "", hours: "" };
  const days = active.map(d => abbr[d]).join(", ");
  const hrs = active.map(d => `${fmt(schedule[d].open)}–${fmt(schedule[d].close)}`);
  const unique = [...new Set(hrs)];
  const hours = unique.length === 1 ? unique[0] : hrs.map((h,i) => `${abbr[active[i]]}: ${h}`).join(", ");
  return { days, hours };
}

export default function ListYourVenuePage() {
  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Step 1 — Basic info
  const [venueName, setVenueName] = useState("");
  const [venueType, setVenueType] = useState("");
  const [otherType, setOtherType] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [zipCode, setZipCode] = useState("");
  const [description, setDescription] = useState("");
  const [websiteUrl, setWebsiteUrl] = useState("");
  const [instagramUrl, setInstagramUrl] = useState("");
  const [facebookUrl, setFacebookUrl] = useState("");

  // Step 2 — Availability & details
  const [useCustom, setUseCustom] = useState(false);
  const [simpleDays, setSimpleDays] = useState("");
  const [simpleHours, setSimpleHours] = useState("");
  const [schedule, setSchedule] = useState<Schedule>(Object.fromEntries(DAYS.map(d => [d, { enabled: false, open: "11:00", close: "14:00" }])));
  const [maxTrucks, setMaxTrucks] = useState("1");
  const [expectedTraffic, setExpectedTraffic] = useState("");
  const [parkingDetails, setParkingDetails] = useState("");

  // Step 3 — Amenities & requirements
  const [hasElectrical, setHasElectrical] = useState(false);
  const [hasWater, setHasWater] = useState(false);
  const [hasRestrooms, setHasRestrooms] = useState(false);
  const [vendorFee, setVendorFee] = useState("");
  const [requiresPermit, setRequiresPermit] = useState(false);
  const [requiresInsurance, setRequiresInsurance] = useState(false);

  // Step 4 — Contact
  const [contactName, setContactName] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [contactPhone, setContactPhone] = useState("");

  // CAPTCHA
  const [turnstileToken, setTurnstileToken] = useState("");
  const turnstileRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<string | null>(null);
  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;

  const totalSteps = 4;
  const progress = (step / totalSteps) * 100;

  // Render Turnstile widget when step 4 is shown
  useEffect(() => {
    if (step !== 4 || !siteKey) return;
    const w = window as any;
    if (!w.turnstile || !turnstileRef.current) return;

    if (widgetIdRef.current) {
      w.turnstile.remove(widgetIdRef.current);
      widgetIdRef.current = null;
    }

    widgetIdRef.current = w.turnstile.render(turnstileRef.current, {
      sitekey: siteKey,
      callback: (token: string) => setTurnstileToken(token),
      "expired-callback": () => setTurnstileToken(""),
    });
  }, [step, siteKey]);

  function toggleDay(day: string) {
    setSchedule(prev => ({ ...prev, [day]: { ...prev[day], enabled: !prev[day].enabled } }));
  }
  function updateTime(day: string, field: "open" | "close", val: string) {
    setSchedule(prev => ({ ...prev, [day]: { ...prev[day], [field]: val } }));
  }

  function validateStep() {
    if (step === 1) {
      if (!venueName.trim()) { setError("Venue name is required."); return false; }
      if (!venueType) { setError("Please select a venue type."); return false; }
      if (!address.trim()) { setError("Address is required."); return false; }
      if (!city.trim()) { setError("City is required."); return false; }
      if (!description.trim()) { setError("Description is required."); return false; }
    }
    if (step === 2) {
      if (useCustom) {
        const s = formatSchedule(schedule);
        if (!s.days) { setError("Please select at least one day."); return false; }
      } else {
        if (!simpleDays || !simpleHours) { setError("Please enter available days and hours."); return false; }
      }
    }
    if (step === 4) {
      if (!contactName.trim()) { setError("Contact name is required."); return false; }
      if (!contactEmail.trim()) { setError("Contact email is required."); return false; }
      if (siteKey && !turnstileToken) { setError("Please complete the verification challenge below."); return false; }
    }
    setError(null);
    return true;
  }

  async function handleSubmit() {
    if (!validateStep()) return;
    setSubmitting(true);
    setError(null);

    let daysAvailable = simpleDays;
    let hoursAvailable = simpleHours;
    if (useCustom) {
      const s = formatSchedule(schedule);
      daysAvailable = s.days;
      hoursAvailable = s.hours;
    }

    const payload = {
      venueName, venueType, venueTypeCustom: venueType === "other" ? otherType : null,
      address, city, zipCode, description,
      websiteUrl: websiteUrl || null, instagramUrl: handleToUrl("instagram", instagramUrl), facebookUrl: handleToUrl("facebook", facebookUrl),
      daysAvailable, hoursAvailable, maxTrucks: parseInt(maxTrucks) || 1,
      expectedTraffic: expectedTraffic || null, parkingDetails: parkingDetails || null,
      hasElectrical, hasWater, hasRestrooms,
      vendorFee: vendorFee || null, requiresPermit, requiresInsurance,
      contactName, contactEmail, contactPhone: contactPhone || null,
      turnstileToken,
    };

    try {
      const res = await fetch("/api/venue-listings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) { const d = await res.json(); throw new Error(d.error ?? "Submission failed."); }
      setSubmitted(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setSubmitting(false);
    }
  }

  const inputCls = "w-full rounded-lg border px-3 py-2.5 text-sm focus:outline-none focus:ring-2";
  const inputStyle = { borderColor: "var(--brand-line)" };

  if (submitted) return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-white">
      <div className="text-center max-w-sm">
        <Logo variant="mark" size={48} className="mx-auto mb-6" />
        <div className="text-4xl mb-4">📬</div>
        <h1 className="text-xl font-medium mb-3">Check your email</h1>
        <p className="text-sm mb-4" style={{ color: "var(--brand-charcoal-soft)" }}>
          We sent a confirmation link to <strong>{contactEmail}</strong>. Click it to publish your listing on the VendorBeacon venue board.
        </p>
        <p className="text-xs mb-4" style={{ color: "var(--brand-charcoal-soft)" }}>
          This extra step keeps the board free of spam and fake listings.
        </p>
        <p className="text-sm" style={{ color: "var(--brand-charcoal-soft)" }}>
          Are you a food truck operator?{" "}
          <a href="/signup" className="underline" style={{ color: "var(--brand-green-dark)" }}>Sign up free</a>
        </p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <div className="border-b px-4 py-3 flex items-center justify-between" style={{ borderColor: "var(--brand-line)" }}>
        <a href="/"><Logo variant="full" size={28} /></a>
        <span className="text-xs" style={{ color: "var(--brand-charcoal-soft)" }}>Step {step} of {totalSteps}</span>
      </div>
      <div className="h-1" style={{ background: "var(--brand-line)" }}>
        <div className="h-1 transition-all" style={{ width: `${progress}%`, background: "var(--brand-green)" }} />
      </div>

      <div className="flex-1 max-w-lg mx-auto w-full px-4 py-8 pb-16">

        {/* STEP 1 — Basic info */}
        {step === 1 && (
          <div className="space-y-4">
            <div><h1 className="text-xl font-bold mb-1">Tell us about your venue</h1>
            <p className="text-sm mb-6" style={{ color: "var(--brand-charcoal-soft)" }}>Basic information about your space.</p></div>
            <div><label className="block text-sm font-medium mb-1.5">Venue name <span style={{ color: "#A32D2D" }}>*</span></label>
              <input type="text" value={venueName} onChange={e => setVenueName(e.target.value)} placeholder="Acme Brewing Co." className={inputCls} style={inputStyle} /></div>
            <div><label className="block text-sm font-medium mb-1.5">Venue type <span style={{ color: "#A32D2D" }}>*</span></label>
              <select value={venueType} onChange={e => setVenueType(e.target.value)} className={inputCls} style={inputStyle}>
                <option value="" disabled>Select one</option>
                {VENUE_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
              {venueType === "other" && <input type="text" value={otherType} onChange={e => setOtherType(e.target.value)} placeholder="Describe your venue type" className={`${inputCls} mt-2`} style={inputStyle} />}
            </div>
            <div><label className="block text-sm font-medium mb-1.5">Street address <span style={{ color: "#A32D2D" }}>*</span></label>
              <input type="text" value={address} onChange={e => setAddress(e.target.value)} placeholder="123 Main St" className={inputCls} style={inputStyle} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="block text-sm font-medium mb-1.5">City <span style={{ color: "#A32D2D" }}>*</span></label>
                <input type="text" value={city} onChange={e => setCity(e.target.value)} placeholder="Chattanooga" className={inputCls} style={inputStyle} /></div>
              <div><label className="block text-sm font-medium mb-1.5">ZIP code</label>
                <input type="text" value={zipCode} onChange={e => setZipCode(e.target.value)} placeholder="37401" className={inputCls} style={inputStyle} /></div>
            </div>
            <div><label className="block text-sm font-medium mb-1.5">Description <span style={{ color: "#A32D2D" }}>*</span></label>
              <textarea rows={4} value={description} onChange={e => setDescription(e.target.value)}
                placeholder="Tell food truck operators what makes your spot great — foot traffic, parking, outdoor space, event types, typical customer base, etc."
                className={inputCls} style={inputStyle} /></div>
            <div><label className="block text-sm font-medium mb-2">Links <span style={{ fontWeight: 400, color: "var(--brand-charcoal-soft)" }}>(optional)</span></label>
              <p className="text-xs mb-2" style={{ color: "var(--brand-charcoal-soft)" }}>
                For Instagram and Facebook, just type your username — we'll build the link for you.
              </p>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs w-20 shrink-0" style={{ color: "var(--brand-charcoal-soft)" }}>Website</span>
                  <input type="url" value={websiteUrl} onChange={e => setWebsiteUrl(e.target.value)} placeholder="https://yourvenue.com" className={inputCls} style={inputStyle} />
                </div>
                {[
                  { label: "Instagram", val: instagramUrl, set: setInstagramUrl, ph: "yourvenue" },
                  { label: "Facebook", val: facebookUrl, set: setFacebookUrl, ph: "yourvenuepage" },
                ].map(({ label, val, set, ph }) => (
                  <div key={label} className="flex items-center gap-2">
                    <span className="text-xs w-20 shrink-0" style={{ color: "var(--brand-charcoal-soft)" }}>{label}</span>
                    <div className="relative flex-1">
                      {!val.startsWith("http") && (
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm pointer-events-none" style={{ color: "var(--brand-charcoal-soft)" }}>@</span>
                      )}
                      <input type="text" value={val} onChange={e => set(e.target.value)} placeholder={ph}
                        className={inputCls} style={{ ...inputStyle, paddingLeft: !val.startsWith("http") ? "1.75rem" : undefined }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* STEP 2 — Availability */}
        {step === 2 && (
          <div className="space-y-4">
            <div><h1 className="text-xl font-bold mb-1">Availability & setup</h1>
            <p className="text-sm mb-6" style={{ color: "var(--brand-charcoal-soft)" }}>When are you open to food trucks and what does setup look like?</p></div>

            <div><label className="block text-sm font-medium mb-2">Available days & hours <span style={{ color: "#A32D2D" }}>*</span></label>
              <div className="flex gap-3 mb-3">
                {[{label:"Simple",val:false},{label:"Custom per day",val:true}].map(opt => (
                  <button key={String(opt.val)} type="button" onClick={() => setUseCustom(opt.val)}
                    className="flex-1 rounded-lg py-2 text-sm font-medium border transition"
                    style={{ background: useCustom === opt.val ? "var(--brand-green)" : "#fff", color: useCustom === opt.val ? "#fff" : "var(--brand-charcoal-soft)", borderColor: useCustom === opt.val ? "var(--brand-green)" : "var(--brand-line)" }}>
                    {opt.label}
                  </button>
                ))}
              </div>
              {!useCustom ? (
                <div className="grid grid-cols-2 gap-3">
                  <div><label className="block text-xs font-medium mb-1">Days</label>
                    <input type="text" value={simpleDays} onChange={e => setSimpleDays(e.target.value)} placeholder="e.g. Mon–Fri" className={inputCls} style={inputStyle} /></div>
                  <div><label className="block text-xs font-medium mb-1">Hours</label>
                    <input type="text" value={simpleHours} onChange={e => setSimpleHours(e.target.value)} placeholder="e.g. 11am–2pm" className={inputCls} style={inputStyle} /></div>
                </div>
              ) : (
                <div className="border rounded-lg overflow-hidden" style={{ borderColor: "var(--brand-line)" }}>
                  {DAYS.map((day, i) => (
                    <div key={day} className="flex items-center gap-3 px-3 py-2"
                      style={{ borderBottom: i < DAYS.length-1 ? "1px solid var(--brand-line)" : "none", background: schedule[day].enabled ? "var(--brand-green-light)" : "#fff" }}>
                      <button type="button" onClick={() => toggleDay(day)} className="w-5 h-5 rounded border-2 flex items-center justify-center"
                        style={{ borderColor: schedule[day].enabled ? "var(--brand-green)" : "var(--brand-line)", background: schedule[day].enabled ? "var(--brand-green)" : "#fff" }}>
                        {schedule[day].enabled && <span style={{ color: "#fff", fontSize: "10px" }}>✓</span>}
                      </button>
                      <span className="text-sm font-medium w-24 shrink-0">{day}</span>
                      {schedule[day].enabled ? (
                        <div className="flex items-center gap-2 flex-1">
                          <input type="time" value={schedule[day].open} onChange={e => updateTime(day,"open",e.target.value)} className="flex-1 rounded border px-2 py-1 text-xs" style={{ borderColor: "var(--brand-line)" }} />
                          <span className="text-xs">to</span>
                          <input type="time" value={schedule[day].close} onChange={e => updateTime(day,"close",e.target.value)} className="flex-1 rounded border px-2 py-1 text-xs" style={{ borderColor: "var(--brand-line)" }} />
                        </div>
                      ) : <span className="text-xs" style={{ color: "var(--brand-charcoal-soft)" }}>Closed</span>}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div><label className="block text-sm font-medium mb-1.5">Max food trucks at one time</label>
              <select value={maxTrucks} onChange={e => setMaxTrucks(e.target.value)} className={inputCls} style={inputStyle}>
                {[1,2,3,4,5,6,7,8,9,10].map(n => <option key={n} value={n}>{n} {n===1?"truck":"trucks"}</option>)}
              </select>
            </div>

            <div><label className="block text-sm font-medium mb-1.5">Expected foot traffic</label>
              <select value={expectedTraffic} onChange={e => setExpectedTraffic(e.target.value)} className={inputCls} style={inputStyle}>
                <option value="">Select traffic level</option>
                {TRAFFIC_OPTIONS.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>

            <div><label className="block text-sm font-medium mb-1.5">Parking & setup details <span style={{ fontWeight: 400, color: "var(--brand-charcoal-soft)" }}>(optional)</span></label>
              <textarea rows={3} value={parkingDetails} onChange={e => setParkingDetails(e.target.value)}
                placeholder="e.g. Large parking lot with room for a 20ft trailer. Pull-through access available. No weight restrictions."
                className={inputCls} style={inputStyle} /></div>
          </div>
        )}

        {/* STEP 3 — Amenities */}
        {step === 3 && (
          <div className="space-y-5">
            <div><h1 className="text-xl font-bold mb-1">Amenities & requirements</h1>
            <p className="text-sm mb-6" style={{ color: "var(--brand-charcoal-soft)" }}>Help vendors understand what's available and what they need to bring.</p></div>

            <div>
              <label className="block text-sm font-medium mb-3">What does your venue provide?</label>
              <div className="space-y-2">
                {[
                  { label: "Electrical access", sub: "110v or 220v outlet nearby", val: hasElectrical, set: setHasElectrical },
                  { label: "Water access", sub: "Hose or water hookup available", val: hasWater, set: setHasWater },
                  { label: "Restroom access", sub: "Vendors and customers can use restrooms", val: hasRestrooms, set: setHasRestrooms },
                ].map(item => (
                  <div key={item.label} className="flex items-center gap-3 rounded-lg border p-3 cursor-pointer" style={{ borderColor: item.val ? "var(--brand-green)" : "var(--brand-line)", background: item.val ? "var(--brand-green-light)" : "#fff" }}
                    onClick={() => item.set(!item.val)}>
                    <div className="w-5 h-5 rounded border-2 flex items-center justify-center shrink-0"
                      style={{ borderColor: item.val ? "var(--brand-green)" : "var(--brand-line)", background: item.val ? "var(--brand-green)" : "#fff" }}>
                      {item.val && <span style={{ color: "#fff", fontSize: "10px" }}>✓</span>}
                    </div>
                    <div>
                      <div className="text-sm font-medium">{item.label}</div>
                      <div className="text-xs" style={{ color: "var(--brand-charcoal-soft)" }}>{item.sub}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div><label className="block text-sm font-medium mb-1.5">Vendor fee</label>
              <select value={vendorFee} onChange={e => setVendorFee(e.target.value)} className={inputCls} style={inputStyle}>
                <option value="">Select fee structure</option>
                {FEE_OPTIONS.map(f => <option key={f.value} value={f.value}>{f.label}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-3">Requirements</label>
              <div className="space-y-2">
                {[
                  { label: "Permits required", sub: "Vendor must obtain permits before arriving", val: requiresPermit, set: setRequiresPermit },
                  { label: "Insurance required", sub: "Vendor must provide proof of liability insurance", val: requiresInsurance, set: setRequiresInsurance },
                ].map(item => (
                  <div key={item.label} className="flex items-center gap-3 rounded-lg border p-3 cursor-pointer" style={{ borderColor: item.val ? "var(--brand-green)" : "var(--brand-line)", background: item.val ? "var(--brand-green-light)" : "#fff" }}
                    onClick={() => item.set(!item.val)}>
                    <div className="w-5 h-5 rounded border-2 flex items-center justify-center shrink-0"
                      style={{ borderColor: item.val ? "var(--brand-green)" : "var(--brand-line)", background: item.val ? "var(--brand-green)" : "#fff" }}>
                      {item.val && <span style={{ color: "#fff", fontSize: "10px" }}>✓</span>}
                    </div>
                    <div>
                      <div className="text-sm font-medium">{item.label}</div>
                      <div className="text-xs" style={{ color: "var(--brand-charcoal-soft)" }}>{item.sub}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* STEP 4 — Contact */}
        {step === 4 && (
          <div className="space-y-4">
            <div><h1 className="text-xl font-bold mb-1">Contact information</h1>
            <p className="text-sm mb-6" style={{ color: "var(--brand-charcoal-soft)" }}>Shown to Pro vendors when they tap "Show contact info." You can use your business name instead of your personal name.</p></div>
            <div><label className="block text-sm font-medium mb-1.5">Contact name or business name <span style={{ color: "#A32D2D" }}>*</span></label>
              <input type="text" value={contactName} onChange={e => setContactName(e.target.value)} placeholder="John Smith or Your Business Name" className={inputCls} style={inputStyle} /></div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div><label className="block text-sm font-medium mb-1.5">Email <span style={{ color: "#A32D2D" }}>*</span></label>
                <input type="email" value={contactEmail} onChange={e => setContactEmail(e.target.value)} placeholder="you@venue.com" className={inputCls} style={inputStyle} /></div>
              <div><label className="block text-sm font-medium mb-1.5">Phone <span style={{ fontWeight: 400, color: "var(--brand-charcoal-soft)" }}>(optional)</span></label>
                <input type="tel" value={contactPhone} onChange={e => setContactPhone(e.target.value)} placeholder="(423) 555-0000" className={inputCls} style={inputStyle} /></div>
            </div>

            {siteKey && (
              <div>
                <label className="block text-sm font-medium mb-1.5">Verification</label>
                <div ref={turnstileRef} />
              </div>
            )}

            <div className="rounded-lg border p-4 mt-2" style={{ borderColor: "var(--brand-line)", background: "#fafaf8" }}>
              <p className="text-xs font-medium mb-2" style={{ color: "var(--brand-charcoal-soft)" }}>BY SUBMITTING THIS LISTING YOU AGREE THAT:</p>
              <ul className="text-xs space-y-1" style={{ color: "var(--brand-charcoal-soft)" }}>
                <li>• The information you provide is accurate and truthful</li>
                <li>• You have the authority to list this venue</li>
                <li>• VendorBeacon is not responsible for the outcome of vendor/venue arrangements</li>
                <li>• Your listing may be reviewed and removed if it violates our <a href="/terms" className="underline" style={{ color: "var(--brand-green-dark)" }}>Terms of Service</a></li>
              </ul>
            </div>
          </div>
        )}

        {error && <p className="text-sm mt-4" style={{ color: "#A32D2D" }}>{error}</p>}

        <div className="flex gap-3 mt-8">
          {step > 1 && (
            <button onClick={() => { setStep(s => s - 1 as any); setError(null); }}
              className="rounded-lg px-4 py-2.5 text-sm border" style={{ borderColor: "var(--brand-line)" }}>
              Back
            </button>
          )}
          {step < totalSteps ? (
            <button onClick={() => { if (validateStep()) setStep(s => s + 1 as any); }}
              className="flex-1 rounded-lg py-2.5 text-sm font-medium text-white"
              style={{ background: "var(--brand-green)" }}>
              Continue
            </button>
          ) : (
            <button onClick={handleSubmit} disabled={submitting}
              className="flex-1 rounded-lg py-2.5 text-sm font-medium text-white disabled:opacity-60"
              style={{ background: "var(--brand-green)" }}>
              {submitting ? "Submitting..." : "List my venue"}
            </button>
          )}
        </div>
        <p className="text-xs text-center mt-3" style={{ color: "var(--brand-charcoal-soft)" }}>
          Free to list · No account needed · Operators contact you directly
        </p>
      </div>
      <Script src="https://challenges.cloudflare.com/turnstile/v0/api.js" async defer />
    </div>
  );
}
