"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { Logo } from "@/components/logo";
import { useRouter } from "next/navigation";

type Step = 1 | 2 | 3 | 4;

export default function OnboardingPage() {
  const router = useRouter();
  const supabase = createClient();

  const [step, setStep] = useState<Step>(1);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loadingInitial, setLoadingInitial] = useState(true);

  // Step 1 — business info
  const [businessName, setBusinessName] = useState("");
  const [description, setDescription] = useState("");
  const [phone, setPhone] = useState("");

  // Step 2 — social links
  const [instagram, setInstagram] = useState("");
  const [facebook, setFacebook] = useState("");
  const [tiktok, setTiktok] = useState("");

  // Step 3 — first stop
  const [stopTitle, setStopTitle] = useState("");
  const [stopAddress, setStopAddress] = useState("");
  const [stopStart, setStopStart] = useState("");
  const [stopEnd, setStopEnd] = useState("");

  // Pre-fill business name (and anything else already saved) from signup
  useEffect(() => {
    async function loadExisting() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setLoadingInitial(false); return; }

      const { data: vendor } = await supabase
        .from("vendors")
        .select("business_name, description, contact_phone, instagram_url, facebook_url, tiktok_url")
        .eq("user_id", user.id)
        .single();

      if (vendor) {
        if (vendor.business_name) setBusinessName(vendor.business_name);
        if (vendor.description) setDescription(vendor.description);
        if (vendor.contact_phone) setPhone(vendor.contact_phone);
        if (vendor.instagram_url) setInstagram(vendor.instagram_url);
        if (vendor.facebook_url) setFacebook(vendor.facebook_url);
        if (vendor.tiktok_url) setTiktok(vendor.tiktok_url);
      }
      setLoadingInitial(false);
    }
    loadExisting();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const totalSteps = 4;
  const progress = (step / totalSteps) * 100;

  async function saveStep1() {
    if (!businessName.trim()) { setError("Business name is required."); return false; }
    setSaving(true);
    setError(null);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setSaving(false); return false; }

    const slugify = (s: string) => s.toLowerCase().trim()
      .replace(/[^a-z0-9\s-]/g, "").replace(/\s+/g, "-").replace(/-+/g, "-");

    const slug = slugify(businessName) || "vendor";

    const { error } = await supabase.from("vendors")
      .update({ business_name: businessName, description: description || null, contact_phone: phone || null })
      .eq("user_id", user.id);

    if (error) { setError(error.message); setSaving(false); return false; }
    setSaving(false);
    return true;
  }

  async function saveStep2() {
    setSaving(true);
    setError(null);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setSaving(false); return false; }

    const { error } = await supabase.from("vendors")
      .update({ instagram_url: instagram || null, facebook_url: facebook || null, tiktok_url: tiktok || null })
      .eq("user_id", user.id);

    if (error) { setError(error.message); setSaving(false); return false; }
    setSaving(false);
    return true;
  }

  async function saveStep3() {
    if (!stopTitle.trim()) return true; // optional step
    if (!stopStart || !stopEnd) { setError("Please add start and end times."); return false; }

    setSaving(true);
    setError(null);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setSaving(false); return false; }

    const { data: vendor } = await supabase.from("vendors").select("id").eq("user_id", user.id).single();
    if (!vendor) { setSaving(false); return false; }

    await supabase.from("locations").insert({
      vendor_id: vendor.id,
      title: stopTitle,
      address: stopAddress || null,
      start_time: new Date(stopStart).toISOString(),
      end_time: new Date(stopEnd).toISOString(),
      source: "manual",
    });

    setSaving(false);
    return true;
  }

  async function handleNext() {
    setError(null);
    let ok = true;
    if (step === 1) ok = await saveStep1();
    if (step === 2) ok = await saveStep2();
    if (step === 3) ok = await saveStep3();
    if (ok) setStep(s => (s + 1) as Step);
  }

  async function handleFinish() {
    router.push("/dashboard");
    router.refresh();
  }

  if (loadingInitial) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <p className="text-sm" style={{ color: "var(--brand-charcoal-soft)" }}>Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Header */}
      <div className="border-b px-4 py-3 flex items-center justify-between" style={{ borderColor: "var(--brand-line)" }}>
        <Logo variant="full" size={30} />
        <span className="text-xs" style={{ color: "var(--brand-charcoal-soft)" }}>Step {step} of {totalSteps}</span>
      </div>

      {/* Progress bar */}
      <div className="h-1 w-full" style={{ background: "var(--brand-line)" }}>
        <div className="h-1 transition-all duration-500" style={{ width: `${progress}%`, background: "var(--brand-green)" }} />
      </div>

      <div className="flex-1 flex items-start justify-center px-4 py-10">
        <div className="w-full max-w-md">

          {/* STEP 1 — Business info */}
          {step === 1 && (
            <div>
              <div className="text-3xl mb-4">🚚</div>
              <h1 className="text-2xl font-bold mb-2" style={{ color: "var(--brand-charcoal)" }}>Tell us about your truck</h1>
              <p className="text-sm mb-8" style={{ color: "var(--brand-charcoal-soft)" }}>
                This shows up on your public page. You can always change it later in Settings.
              </p>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1.5">Business name <span style={{ color: "#A32D2D" }}>*</span></label>
                  <input type="text" value={businessName} onChange={e => setBusinessName(e.target.value)}
                    placeholder="My Food Truck"
                    className="w-full rounded-lg border px-3 py-2.5 text-sm focus:outline-none focus:ring-2"
                    style={{ borderColor: "var(--brand-line)" }} />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5">Description <span style={{ fontWeight: 400, color: "var(--brand-charcoal-soft)" }}>(optional)</span></label>
                  <textarea rows={3} value={description} onChange={e => setDescription(e.target.value)}
                    placeholder="Describe your food truck — cuisine type, specialties, what makes you unique."
                    className="w-full rounded-lg border px-3 py-2.5 text-sm focus:outline-none focus:ring-2"
                    style={{ borderColor: "var(--brand-line)" }} />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5">Phone number <span style={{ fontWeight: 400, color: "var(--brand-charcoal-soft)" }}>(optional)</span></label>
                  <input type="tel" value={phone} onChange={e => setPhone(e.target.value)}
                    placeholder="(423) 555-0000"
                    className="w-full rounded-lg border px-3 py-2.5 text-sm focus:outline-none focus:ring-2"
                    style={{ borderColor: "var(--brand-line)" }} />
                </div>
              </div>
            </div>
          )}

          {/* STEP 2 — Social links */}
          {step === 2 && (
            <div>
              <div className="text-3xl mb-4">📱</div>
              <h1 className="text-2xl font-bold mb-2" style={{ color: "var(--brand-charcoal)" }}>Connect your socials</h1>
              <p className="text-sm mb-8" style={{ color: "var(--brand-charcoal-soft)" }}>
                These show up on your public page so customers and venues can follow you. All optional.
              </p>
              <div className="space-y-4">
                {[
                  { label: "Instagram", value: instagram, setter: setInstagram, placeholder: "https://instagram.com/yourtruck" },
                  { label: "Facebook", value: facebook, setter: setFacebook, placeholder: "https://facebook.com/yourtruck" },
                  { label: "TikTok", value: tiktok, setter: setTiktok, placeholder: "https://tiktok.com/@yourtruck" },
                ].map(({ label, value, setter, placeholder }) => (
                  <div key={label}>
                    <label className="block text-sm font-medium mb-1.5">{label}</label>
                    <input type="url" value={value} onChange={e => setter(e.target.value)} placeholder={placeholder}
                      className="w-full rounded-lg border px-3 py-2.5 text-sm focus:outline-none focus:ring-2"
                      style={{ borderColor: "var(--brand-line)" }} />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* STEP 3 — First stop */}
          {step === 3 && (
            <div>
              <div className="text-3xl mb-4">📍</div>
              <h1 className="text-2xl font-bold mb-2" style={{ color: "var(--brand-charcoal)" }}>Add your first stop</h1>
              <p className="text-sm mb-3" style={{ color: "var(--brand-charcoal-soft)" }}>
                Where are you parking this week? This shows up on your public page right away.
              </p>
              <button
                type="button"
                onClick={() => { setStopTitle(""); setStopAddress(""); setStopStart(""); setStopEnd(""); setStep(4); }}
                className="text-sm font-medium underline mb-6"
                style={{ color: "var(--brand-green-dark)" }}>
                Skip this for now — I'll add it later →
              </button>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1.5">Where</label>
                  <input type="text" value={stopTitle} onChange={e => setStopTitle(e.target.value)}
                    placeholder="Main Street Brewery"
                    className="w-full rounded-lg border px-3 py-2.5 text-sm focus:outline-none focus:ring-2"
                    style={{ borderColor: "var(--brand-line)" }} />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5">Address <span style={{ fontWeight: 400, color: "var(--brand-charcoal-soft)" }}>(optional)</span></label>
                  <input type="text" value={stopAddress} onChange={e => setStopAddress(e.target.value)}
                    placeholder="123 Main St, City, TN"
                    className="w-full rounded-lg border px-3 py-2.5 text-sm focus:outline-none focus:ring-2"
                    style={{ borderColor: "var(--brand-line)" }} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium mb-1.5">Start</label>
                    <input type="datetime-local" value={stopStart} onChange={e => setStopStart(e.target.value)}
                      className="w-full rounded-lg border px-3 py-2.5 text-sm focus:outline-none focus:ring-2"
                      style={{ borderColor: "var(--brand-line)" }} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1.5">End</label>
                    <input type="datetime-local" value={stopEnd} onChange={e => setStopEnd(e.target.value)}
                      className="w-full rounded-lg border px-3 py-2.5 text-sm focus:outline-none focus:ring-2"
                      style={{ borderColor: "var(--brand-line)" }} />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 4 — Done / teaser */}
          {step === 4 && (
            <div className="text-center">
              <div className="text-5xl mb-6">🎉</div>
              <h1 className="text-2xl font-bold mb-3" style={{ color: "var(--brand-charcoal)" }}>You're all set!</h1>
              <p className="text-sm mb-8" style={{ color: "var(--brand-charcoal-soft)" }}>
                Your public page is live. Share your link everywhere to let customers and venues know where to find you.
              </p>

              <div className="rounded-xl border p-5 mb-6 text-left" style={{ background: "var(--brand-green-light)", borderColor: "#a8cf72" }}>
                <p className="text-xs font-bold uppercase tracking-wide mb-2" style={{ color: "var(--brand-green-dark)" }}>
                  Want to find new venues and accept bookings?
                </p>
                <p className="text-sm mb-3" style={{ color: "var(--brand-green-dark)", opacity: 0.9 }}>
                  Upgrade to Pro to browse local venues actively looking for food trucks, accept booking requests, and grow your recurring locations.
                </p>
                <a href="/pricing"
                  className="inline-block text-sm font-semibold px-4 py-2 rounded-lg text-white"
                  style={{ background: "var(--brand-green)" }}>
                  View Pro plans
                </a>
              </div>
            </div>
          )}

          {/* Error */}
          {error && <p className="text-sm mt-4" style={{ color: "#A32D2D" }}>{error}</p>}

          {/* Navigation */}
          <div className="mt-8 flex gap-3">
            {step > 1 && step < 4 && (
              <button onClick={() => setStep(s => (s - 1) as Step)}
                className="rounded-lg px-4 py-2.5 text-sm border"
                style={{ borderColor: "var(--brand-line)" }}>
                Back
              </button>
            )}
            {step < 4 && (
              <button onClick={handleNext} disabled={saving}
                className="flex-1 rounded-lg py-2.5 text-sm font-medium text-white disabled:opacity-60"
                style={{ background: "var(--brand-green)" }}>
                {saving ? "Saving..." : step === 3 ? (stopTitle ? "Add stop & continue" : "Skip for now") : "Continue"}
              </button>
            )}
            {step === 4 && (
              <button onClick={handleFinish}
                className="w-full rounded-lg py-2.5 text-sm font-medium text-white"
                style={{ background: "var(--brand-green)" }}>
                Go to my dashboard →
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
