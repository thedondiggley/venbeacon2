"use client";

import { useState } from "react";

export function FeedbackForm({
  vendorId,
  vendorName,
  vendorEmail,
}: {
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
    { value: "feature_request", label: "Feature request" },
    { value: "bug", label: "Bug report" },
    { value: "general", label: "General feedback" },
  ];

  if (submitted) {
    return (
      <div className="rounded-lg border p-4 text-center" style={{ borderColor: "var(--brand-line)", background: "var(--brand-green-light)" }}>
        <p className="text-sm font-medium" style={{ color: "var(--brand-green-dark)" }}>Thanks — got it! 🙌</p>
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
            className="rounded-full px-3 py-1 text-xs font-medium border transition"
            style={{
              background: category === c.value ? "var(--brand-green)" : "#fff",
              color: category === c.value ? "#fff" : "var(--brand-charcoal-soft)",
              borderColor: category === c.value ? "var(--brand-green)" : "var(--brand-line)",
            }}>
            {c.label}
          </button>
        ))}
      </div>
      <textarea
        value={message}
        onChange={e => setMessage(e.target.value)}
        rows={4}
        placeholder="What's on your mind? A bug you hit, something you wish the app could do, anything."
        className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2"
        style={{ borderColor: "var(--brand-line)" }}
      />
      {error && <p className="text-xs" style={{ color: "#A32D2D" }}>{error}</p>}
      <button type="submit" disabled={submitting}
        className="rounded-lg px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
        style={{ background: "var(--brand-green)" }}>
        {submitting ? "Sending..." : "Send feedback"}
      </button>
    </form>
  );
}
