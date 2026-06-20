"use client";

import { Logo } from "@/components/logo";

export default function Home() {
  return (
    <div className="min-h-screen bg-white">
      {/* Hero */}
      <div className="max-w-4xl mx-auto px-4 py-20 text-center">
        <div className="flex justify-center mb-8">
          <Logo variant="full" size={48} />
        </div>
        <h1 className="text-4xl sm:text-5xl font-bold mb-4 leading-tight" style={{ color: "var(--brand-charcoal)" }}>
          Find more places to park.<br />Generate more bookings.
        </h1>
        <p className="text-lg max-w-xl mx-auto mb-8" style={{ color: "var(--brand-charcoal-soft)" }}>
          Manage your schedule, discover venues looking for food trucks, and accept booking requests — all from one platform.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <a href="/signup" className="rounded-xl px-6 py-3 text-base font-semibold text-white" style={{ background: "var(--brand-green)" }}>
            Get started free
          </a>
          <a href="/login" className="rounded-xl px-6 py-3 text-base font-semibold border" style={{ borderColor: "var(--brand-line)", color: "var(--brand-charcoal)" }}>
            Log in
          </a>
        </div>
        <p className="mt-4 text-sm" style={{ color: "var(--brand-charcoal-soft)" }}>
          <a href="/pricing" className="underline" style={{ color: "var(--brand-green-dark)" }}>View pricing</a> — free to start, Pro from $25/month
        </p>
      </div>

      {/* Features */}
      <div className="max-w-4xl mx-auto px-4 pb-20">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <div className="rounded-xl border p-6" style={{ borderColor: "var(--brand-line)" }}>
            <div className="text-2xl mb-3">📍</div>
            <h3 className="font-semibold mb-2">One link, everywhere</h3>
            <p className="text-sm" style={{ color: "var(--brand-charcoal-soft)" }}>
              Share one link on Instagram, Facebook, TikTok, and Google. Your schedule updates automatically — no more manual daily posts.
            </p>
          </div>
          <div className="rounded-xl border p-6" style={{ borderColor: "var(--brand-line)", background: "var(--brand-green-light)" }}>
            <div className="text-2xl mb-3">🏢</div>
            <h3 className="font-semibold mb-2">Discover new venues</h3>
            <p className="text-sm" style={{ color: "var(--brand-charcoal-soft)" }}>
              Browse local breweries, apartment communities, office parks, and event spaces that want food trucks — and reach out directly.
            </p>
          </div>
          <div className="rounded-xl border p-6" style={{ borderColor: "var(--brand-line)" }}>
            <div className="text-2xl mb-3">📥</div>
            <h3 className="font-semibold mb-2">Accept booking requests</h3>
            <p className="text-sm" style={{ color: "var(--brand-charcoal-soft)" }}>
              Venues book you directly through your public page. Approve with one tap — it auto-adds to your schedule.
            </p>
          </div>
        </div>
      </div>

      {/* CTA split */}
      <div className="border-t" style={{ borderColor: "var(--brand-line)" }}>
        <div className="max-w-4xl mx-auto px-4 py-16 grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div className="rounded-xl p-6 cursor-pointer" style={{ background: "var(--brand-green)" }} onClick={() => window.location.href = "/signup"}>
            <div className="text-2xl mb-3">🚚</div>
            <h3 className="text-lg font-bold text-white mb-2">I'm a food truck or vendor</h3>
            <p className="text-sm text-white opacity-90 mb-4">Set up your public page, manage your schedule, and start finding new locations.</p>
            <span className="inline-block text-sm font-semibold px-4 py-2 rounded-lg" style={{ background: "rgba(255,255,255,.2)", color: "#fff" }}>
              Sign up free →
            </span>
          </div>
          <div className="rounded-xl p-6 border cursor-pointer" style={{ borderColor: "var(--brand-line)" }} onClick={() => window.location.href = "/list-your-venue"}>
            <div className="text-2xl mb-3">🏢</div>
            <h3 className="text-lg font-bold mb-2" style={{ color: "var(--brand-charcoal)" }}>I have a venue</h3>
            <p className="text-sm mb-4" style={{ color: "var(--brand-charcoal-soft)" }}>List your space on the venue board so food truck operators in your area can find you. Free, no account needed.</p>
            <span className="inline-block text-sm font-semibold px-4 py-2 rounded-lg" style={{ background: "var(--brand-green-light)", color: "var(--brand-green-dark)" }}>
              List my venue →
            </span>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="border-t py-8 px-4" style={{ borderColor: "var(--brand-line)" }}>
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs" style={{ color: "var(--brand-charcoal-soft)" }}>
            © 2026 VendorBeacon. All rights reserved.
          </p>
          <div className="flex gap-4">
            <a href="/terms" className="text-xs underline" style={{ color: "var(--brand-charcoal-soft)" }}>Terms</a>
            <a href="/privacy" className="text-xs underline" style={{ color: "var(--brand-charcoal-soft)" }}>Privacy</a>
            <a href="/contact" className="text-xs underline" style={{ color: "var(--brand-charcoal-soft)" }}>Contact</a>
            <a href="/pricing" className="text-xs underline" style={{ color: "var(--brand-charcoal-soft)" }}>Pricing</a>
          </div>
        </div>
      </div>
    </div>
  );
}

// Add footer — this is appended to the existing page
