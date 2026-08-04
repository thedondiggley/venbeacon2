"use client";
import { useState } from "react";
import { Button, useToast } from "@/components/ui";

export function FeedbackForm({ vendorId, vendorName, vendorEmail }: { vendorId: string; vendorName: string; vendorEmail: string | null }) {
  const { toast } = useToast();
  const [category, setCategory] = useState<"bug" | "feature_request" | "general">("feature_request");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!message.trim()) { toast("Please describe your feedback.", "error"); return; }
    setSubmitting(true);
    try {
      const res = await fetch("/api/feedback", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ vendorId, vendorName, vendorEmail, category, message }),
      });
      if (!res.ok) throw new Error();
      toast("Feedback sent. Thanks!");
      setMessage("");
    } catch {
      toast("Failed to send. Try again.", "error");
    } finally {
      setSubmitting(false);
    }
  }

  const cats = [{ value: "feature_request", label: "Feature idea" }, { value: "bug", label: "Bug report" }, { value: "general", label: "General" }];

  return (
    <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
        {cats.map(c => (
          <button key={c.value} type="button" onClick={() => setCategory(c.value as typeof category)} style={{
            padding: "6px 14px", borderRadius: 9999, fontSize: 13, fontWeight: 600, cursor: "pointer",
            background: category === c.value ? "var(--green)" : "var(--bg)",
            color: category === c.value ? "var(--green-dark)" : "var(--text-3)",
            border: `1px solid ${category === c.value ? "var(--green-border)" : "var(--border)"}`,
          }}>{c.label}</button>
        ))}
      </div>
      <textarea value={message} onChange={e => setMessage(e.target.value)} rows={3}
        placeholder="What's on your mind? A bug you hit, something you wish the app could do, or anything else."
        style={{ width: "100%", padding: "12px", fontSize: 14, color: "var(--text)", background: "var(--bg)", border: "1px solid var(--border-2)", borderRadius: "var(--r-md)", outline: "none", resize: "vertical", fontFamily: "inherit", minHeight: 90 }} />
      <div>
        <Button type="submit" loading={submitting} size="md">Send feedback</Button>
      </div>
    </form>
  );
}
