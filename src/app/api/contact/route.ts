import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";

const rateMap = new Map<string, { count: number; reset: number }>();
function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = rateMap.get(ip);
  if (!entry || now > entry.reset) { rateMap.set(ip, { count: 1, reset: now + 15*60*1000 }); return true; }
  if (entry.count >= 3) return false;
  entry.count++;
  return true;
}

export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0] ?? "unknown";
  if (!checkRateLimit(ip)) return NextResponse.json({ error: "Too many requests. Please wait before sending another message." }, { status: 429 });

  const { name, email, subject, message } = await req.json();
  if (!name?.trim() || !email?.trim() || !subject?.trim() || !message?.trim()) {
    return NextResponse.json({ error: "All fields are required." }, { status: 400 });
  }
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailPattern.test(email)) return NextResponse.json({ error: "Invalid email address." }, { status: 400 });

  if (process.env.RESEND_API_KEY) {
    const resend = new Resend(process.env.RESEND_API_KEY);
    const supportEmail = process.env.OWNER_NOTIFICATION_EMAIL ?? "support@vendorbeacon.app";

    try {
      // Notify support
      await resend.emails.send({
        from: process.env.BOOKING_NOTIFICATION_FROM_EMAIL ?? "VendorBeacon <notifications@vendorbeacon.app>",
        to: supportEmail,
        replyTo: email,
        subject: `[Contact Form] ${subject} — ${name}`,
        html: `<div style="font-family:-apple-system,sans-serif;max-width:480px;margin:0 auto;padding:24px">
<h2 style="font-size:16px">New contact form submission</h2>
<p><strong>Name:</strong> ${name}</p>
<p><strong>Email:</strong> ${email}</p>
<p><strong>Subject:</strong> ${subject}</p>
<p><strong>Message:</strong></p>
<p style="white-space:pre-wrap;background:#f8f8f6;padding:12px;border-radius:8px">${message}</p>
</div>`,
      });

      // Confirmation to user
      await resend.emails.send({
        from: process.env.BOOKING_NOTIFICATION_FROM_EMAIL ?? "VendorBeacon <notifications@vendorbeacon.app>",
        to: email,
        subject: "We received your message — VendorBeacon",
        html: `<div style="font-family:-apple-system,sans-serif;max-width:480px;margin:0 auto;padding:24px;background:#fff">
<div style="background:#639922;border-radius:8px;padding:16px;text-align:center;margin-bottom:20px"><span style="color:#fff;font-size:18px;font-weight:700">VendorBeacon</span></div>
<h2 style="font-size:16px">Thanks for reaching out, ${name}!</h2>
<p style="font-size:13px;color:#5F5E5A">We received your message about "${subject}" and will respond within 24 hours.</p>
</div>`,
      }).catch(() => {});
    } catch (err) {
      console.error("Contact form email error:", err);
      return NextResponse.json({ error: "Failed to send message. Please email us directly." }, { status: 500 });
    }
  }

  return NextResponse.json({ ok: true });
}
