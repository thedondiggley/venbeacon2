"use client";

import { useState } from "react";
import { Logo } from "@/components/logo";

export default function ContactPage() {
  const [sent, setSent] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setSending(true);

    const form = e.currentTarget;
    const data = new FormData(form);
    const payload = {
      name: data.get("name"),
      email: data.get("email"),
      subject: data.get("subject"),
      message: data.get("message"),
    };

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error ?? "Failed to send message.");
      }
      setSent(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-lg mx-auto px-4 py-10 pb-20">
        <div className="mb-8"><a href="/"><Logo variant="full" size={30} /></a></div>
        <h1 className="text-2xl font-bold mb-2">Contact & Support</h1>
        <p className="text-sm mb-8" style={{ color: "var(--brand-charcoal-soft)" }}>
          Have a question, issue, or feedback? We're here to help.
        </p>

        <div className="space-y-4 mb-10">
          <div className="rounded-xl border p-4" style={{ borderColor: "var(--brand-line)" }}>
            <div className="flex items-start gap-3">
              <span className="text-xl">📧</span>
              <div>
                <p className="text-sm font-medium mb-0.5">Email support</p>
                <p className="text-sm" style={{ color: "var(--brand-charcoal-soft)" }}>
                  Best for billing questions, account issues, and bug reports.
                </p>
                <a href="mailto:support@vendorbeacon.app"
                  className="text-sm font-medium underline mt-1 block"
                  style={{ color: "var(--brand-green-dark)" }}>
                  support@vendorbeacon.app
                </a>
              </div>
            </div>
          </div>
          <div className="rounded-xl border p-4" style={{ borderColor: "var(--brand-line)" }}>
            <div className="flex items-start gap-3">
              <span className="text-xl">⏱</span>
              <div>
                <p className="text-sm font-medium mb-0.5">Response time</p>
                <p className="text-sm" style={{ color: "var(--brand-charcoal-soft)" }}>
                  We typically respond within 24 hours on business days.
                </p>
              </div>
            </div>
          </div>
        </div>

        {!sent ? (
          <form onSubmit={handleSubmit} className="space-y-4">
            <h2 className="text-base font-semibold">Send us a message</h2>
            <div>
              <label className="block text-sm font-medium mb-1.5">Your name</label>
              <input name="name" type="text" required placeholder="John Smith"
                className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2"
                style={{ borderColor: "var(--brand-line)" }} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">Email address</label>
              <input name="email" type="email" required placeholder="you@example.com"
                className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2"
                style={{ borderColor: "var(--brand-line)" }} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">Subject</label>
              <select name="subject" required defaultValue=""
                className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2"
                style={{ borderColor: "var(--brand-line)" }}>
                <option value="" disabled>Select a topic</option>
                <option>Account or login issue</option>
                <option>Billing or subscription</option>
                <option>Bug or technical issue</option>
                <option>Feature request</option>
                <option>Venue listing question</option>
                <option>Report a listing</option>
                <option>General question</option>
                <option>Other</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">Message</label>
              <textarea name="message" rows={5} required placeholder="Describe your issue or question in detail..."
                className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2"
                style={{ borderColor: "var(--brand-line)" }} />
            </div>
            {error && <p className="text-sm" style={{ color: "#A32D2D" }}>{error}</p>}
            <button type="submit" disabled={sending}
              className="w-full rounded-lg py-2.5 text-sm font-medium text-white disabled:opacity-60"
              style={{ background: "var(--brand-green)" }}>
              {sending ? "Sending..." : "Send message"}
            </button>
          </form>
        ) : (
          <div className="text-center py-8">
            <div className="text-4xl mb-3">✅</div>
            <p className="text-sm font-medium">Message sent!</p>
            <p className="text-sm mt-1" style={{ color: "var(--brand-charcoal-soft)" }}>
              We'll get back to you within 24 hours. Check your email for a confirmation.
            </p>
          </div>
        )}

        <div className="mt-10 pt-6 border-t flex gap-4 flex-wrap text-sm" style={{ borderColor: "var(--brand-line)" }}>
          <a href="/terms" className="underline" style={{ color: "var(--brand-charcoal-soft)" }}>Terms</a>
          <a href="/privacy" className="underline" style={{ color: "var(--brand-charcoal-soft)" }}>Privacy</a>
          <a href="/refund" className="underline" style={{ color: "var(--brand-charcoal-soft)" }}>Refunds</a>
          <a href="/guidelines" className="underline" style={{ color: "var(--brand-charcoal-soft)" }}>Guidelines</a>
        </div>
      </div>
    </div>
  );
}
