import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { Resend } from "resend";

const rateMap = new Map<string, { count: number; reset: number }>();
function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = rateMap.get(ip);
  if (!entry || now > entry.reset) { rateMap.set(ip, { count: 1, reset: now + 15*60*1000 }); return true; }
  if (entry.count >= 5) return false;
  entry.count++;
  return true;
}

export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0] ?? "unknown";
  if (!checkRateLimit(ip)) return NextResponse.json({ error: "Too many submissions. Please wait before sending more." }, { status: 429 });

  const { vendorId, vendorName, vendorEmail, category, message } = await req.json();

  if (!message?.trim()) return NextResponse.json({ error: "Message is required." }, { status: 400 });
  if (!["bug", "feature_request", "general"].includes(category)) {
    return NextResponse.json({ error: "Invalid category." }, { status: 400 });
  }

  const supabase = createServiceClient();

  const { error } = await supabase.from("feedback").insert({
    vendor_id: vendorId || null,
    vendor_name: vendorName || null,
    vendor_email: vendorEmail || null,
    category,
    message,
  });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Notify owner of new feedback
  const ownerEmail = process.env.OWNER_NOTIFICATION_EMAIL;
  if (process.env.RESEND_API_KEY && ownerEmail) {
    const resend = new Resend(process.env.RESEND_API_KEY);
    const categoryLabels: Record<string, string> = { bug: "🐛 Bug report", feature_request: "💡 Feature request", general: "💬 General feedback" };
    await resend.emails.send({
      from: process.env.BOOKING_NOTIFICATION_FROM_EMAIL ?? "VendorBeacon <notifications@vendorbeacon.app>",
      to: ownerEmail,
      subject: `${categoryLabels[category]} from ${vendorName || "a vendor"}`,
      html: `<div style="font-family:-apple-system,sans-serif;max-width:480px;margin:0 auto;padding:24px">
<h2 style="font-size:16px">${categoryLabels[category]}</h2>
<p><strong>From:</strong> ${vendorName || "Unknown"} ${vendorEmail ? `(${vendorEmail})` : ""}</p>
<p style="white-space:pre-wrap;background:#f8f8f6;padding:12px;border-radius:8px;margin-top:12px">${message}</p>
<a href="${process.env.NEXT_PUBLIC_APP_URL ?? "https://vendorbeacon.app"}/admin" style="display:block;margin-top:16px;color:#639922">View in admin dashboard →</a>
</div>`,
    }).catch(() => {});
  }

  return NextResponse.json({ ok: true }, { status: 201 });
}
