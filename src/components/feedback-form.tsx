"use client";

import { useState } from "react";

export function FeedbackForm({ vendorId, vendorName, vendorEmail }: {
  vendorId: string;
  vendorName: string;
  vendorEmail: string | null;
}) {
  const [category, setCategory] = useState<"bug" | "feature_request" | "general">("feature_request");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!message.trim()) { setError("Please describe your feedback."); return; }
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ vendorId, vendorName, vendorEmail, category, message }),
      });
      if (!res.ok) throw new Error("Failed to send feedback.");
      setSubmitted(true);
      setMessage("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setSubmitting(false);
    }
  }

  const categories = [
    { value: "feature_request", label: "Feature idea" },
    { value: "bug", label: "Bug report" },
    { value: "general", label: "General" },
  ];

  if (submitted) {
    return (
      <div className="rounded-xl p-4 text-center" style={{ background: "var(--brand-green-light)", border: "0.5px solid var(--brand-green)" }}>
        <p className="text-sm font-semibold" style={{ color: "var(--brand-green-dark)" }}>Thanks — got it! 🙌</p>
        <p className="text-xs mt-1" style={{ color: "var(--brand-green-dark)", opacity: 0.85 }}>
          We read every submission and use them to shape what we build next.
        </p>
        <button onClick={() => setSubmitted(false)} className="text-xs underline mt-2" style={{ color: "var(--brand-green-dark)" }}>
          Submit another
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="flex gap-2 flex-wrap">
        {categories.map(c => (
          <button key={c.value} type="button" onClick={() => setCategory(c.value as typeof category)}
            className="rounded-full px-3 py-1.5 text-xs font-medium transition"
            style={{
              background: category === c.value ? "var(--brand-green)" : "var(--brand-surface)",
              color: category === c.value ? "var(--brand-green-darker)" : "var(--brand-charcoal-soft)",
              border: `0.5px solid ${category === c.value ? "var(--brand-green)" : "var(--brand-line)"}`,
            }}>
            {c.label}
          </button>
        ))}
      </div>
      <textarea value={message} onChange={e => setMessage(e.target.value)} rows={3}
        placeholder="What's on your mind? A bug you hit, something you wish the app could do, anything."
        className="w-full rounded-xl border px-3 py-2.5 text-sm focus:outline-none"
        style={{ borderColor: "var(--brand-line)", background: "var(--brand-surface)" }} />
      {error && <p className="text-xs" style={{ color: "#DC2626" }}>{error}</p>}
      <button type="submit" disabled={submitting}
        className="rounded-xl px-4 py-2 text-sm font-semibold disabled:opacity-60"
        style={{ background: "var(--brand-green)", color: "var(--brand-green-darker)" }}>
        {submitting ? "Sending..." : "Send feedback"}
      </button>
    </form>
  );
}
