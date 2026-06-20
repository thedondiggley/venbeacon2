import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { Resend } from "resend";

// Simple in-memory rate limiter (per IP, 3 requests per 15 minutes)
const rateMap = new Map<string, { count: number; reset: number }>();

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const window = 15 * 60 * 1000; // 15 minutes
  const limit = 3;
  const entry = rateMap.get(ip);
  if (!entry || now > entry.reset) {
    rateMap.set(ip, { count: 1, reset: now + window });
    return true;
  }
  if (entry.count >= limit) return false;
  entry.count++;
  return true;
}

const EVENT_TYPE_LABELS: Record<string, string> = {
  brewery: "Brewery / taproom", apartment: "Apartment community", office: "Office park",
  festival: "Festival", school: "School", private: "Private event", other: "Other",
};

function formatTime(t: string) {
  const [h, m] = t.split(":").map(Number);
  const ap = h >= 12 ? "PM" : "AM";
  const h12 = h > 12 ? h - 12 : h === 0 ? 12 : h;
  return `${h12}:${m.toString().padStart(2,"0")} ${ap}`;
}

function formatDate(d: string) {
  return new Date(d + "T12:00:00").toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric", year: "numeric" });
}

export async function POST(req: NextRequest) {
  // Rate limiting
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0] ?? req.headers.get("x-real-ip") ?? "unknown";
  if (!checkRateLimit(ip)) {
    return NextResponse.json({ error: "Too many requests. Please wait before submitting another booking request." }, { status: 429 });
  }

  const body = await req.json();
  const { vendorId, venueName, contactName, contactEmail, contactPhone, eventDate, startTime, endTime, venueAddress, eventType, expectedAttendance, notes } = body;

  // Validation
  const required = { vendorId, venueName, contactName, contactEmail, eventDate, startTime, endTime, venueAddress, eventType };
  for (const [key, value] of Object.entries(required)) {
    if (!value?.toString().trim()) return NextResponse.json({ error: `Missing required field: ${key}` }, { status: 400 });
  }

  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailPattern.test(contactEmail)) return NextResponse.json({ error: "Invalid email address" }, { status: 400 });

  const supabase = createServiceClient();

  const { data: vendor } = await supabase.from("vendors").select("id, business_name, contact_email, slug, is_pro").eq("id", vendorId).single();
  if (!vendor) return NextResponse.json({ error: "Vendor not found" }, { status: 404 });
  if (!vendor.is_pro) return NextResponse.json({ error: "not_accepting", message: "This vendor is not currently accepting bookings through VendorBeacon." }, { status: 403 });

  // Check for duplicate request (same email + vendor + date)
  const { data: existing } = await supabase.from("bookings")
    .select("id").eq("vendor_id", vendorId).eq("contact_email", contactEmail).eq("event_date", eventDate).maybeSingle();
  if (existing) return NextResponse.json({ error: "You have already submitted a booking request for this date." }, { status: 409 });

  const { data: booking, error: insertError } = await supabase.from("bookings").insert({
    vendor_id: vendorId, venue_name: venueName, contact_name: contactName,
    contact_email: contactEmail, contact_phone: contactPhone || null,
    event_date: eventDate, start_time: startTime, end_time: endTime,
    venue_address: venueAddress, event_type: eventType,
    expected_attendance: expectedAttendance || null, notes: notes || null,
  }).select().single();

  if (insertError) return NextResponse.json({ error: insertError.message }, { status: 500 });

  try {
    await supabase.from("analytics_events").insert({ vendor_id: vendorId, event_type: "booking_request", metadata: { event_type: eventType, venue_name: venueName } });
  } catch { /* swallow analytics errors */ }

  // Send branded notification to vendor
  if (process.env.RESEND_API_KEY && vendor.contact_email) {
    try {
      const resend = new Resend(process.env.RESEND_API_KEY);
      const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://vendorbeacon.app";
      await resend.emails.send({
        from: process.env.BOOKING_NOTIFICATION_FROM_EMAIL ?? "VendorBeacon <notifications@vendorbeacon.app>",
        to: vendor.contact_email,
        subject: `New booking request from ${venueName}`,
        html: `<!DOCTYPE html><html><head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background:#f0f0ee;font-family:-apple-system,sans-serif;">
<div style="max-width:540px;margin:40px auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,.08)">
  <div style="background:#639922;padding:28px 36px"><div style="font-size:22px;font-weight:800;color:#fff">VendorBeacon</div><div style="font-size:14px;color:rgba(255,255,255,.85);margin-top:4px">New booking request</div></div>
  <div style="padding:32px 36px">
    <h1 style="font-size:20px;font-weight:700;color:#2C2C2A;margin:0 0 6px">You have a new booking request 📥</h1>
    <p style="font-size:14px;color:#5F5E5A;margin:0 0 24px;line-height:1.6"><strong>${venueName}</strong> wants to book <strong>${vendor.business_name}</strong> for an upcoming event.</p>
    <div style="background:#EAF3DE;border-radius:10px;padding:20px;margin-bottom:24px">
      <div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.06em;color:#3B6D11;margin-bottom:14px">Event details</div>
      <table style="width:100%;border-collapse:collapse">
        <tr><td style="padding:6px 0;color:#5F5E5A;font-size:13px;width:40%">Venue</td><td style="padding:6px 0;font-size:13px;font-weight:600;color:#2C2C2A">${venueName}</td></tr>
        <tr><td style="padding:6px 0;color:#5F5E5A;font-size:13px">Type</td><td style="padding:6px 0;font-size:13px;color:#2C2C2A">${EVENT_TYPE_LABELS[eventType] ?? eventType}</td></tr>
        <tr><td style="padding:6px 0;color:#5F5E5A;font-size:13px">Date</td><td style="padding:6px 0;font-size:13px;font-weight:600;color:#2C2C2A">${formatDate(eventDate)}</td></tr>
        <tr><td style="padding:6px 0;color:#5F5E5A;font-size:13px">Time</td><td style="padding:6px 0;font-size:13px;color:#2C2C2A">${formatTime(startTime)} – ${formatTime(endTime)}</td></tr>
        <tr><td style="padding:6px 0;color:#5F5E5A;font-size:13px">Address</td><td style="padding:6px 0;font-size:13px;color:#2C2C2A">${venueAddress}</td></tr>
        ${expectedAttendance ? `<tr><td style="padding:6px 0;color:#5F5E5A;font-size:13px">Expected</td><td style="padding:6px 0;font-size:13px;color:#2C2C2A">${expectedAttendance} people</td></tr>` : ""}
      </table>
    </div>
    <div style="border:1px solid #D3D1C7;border-radius:10px;padding:18px;margin-bottom:24px">
      <div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.06em;color:#5F5E5A;margin-bottom:12px">Contact</div>
      <table style="width:100%;border-collapse:collapse">
        <tr><td style="padding:5px 0;color:#5F5E5A;font-size:13px;width:40%">Name</td><td style="padding:5px 0;font-size:13px;font-weight:600;color:#2C2C2A">${contactName}</td></tr>
        <tr><td style="padding:5px 0;color:#5F5E5A;font-size:13px">Email</td><td style="padding:5px 0;font-size:13px"><a href="mailto:${contactEmail}" style="color:#639922">${contactEmail}</a></td></tr>
        ${contactPhone ? `<tr><td style="padding:5px 0;color:#5F5E5A;font-size:13px">Phone</td><td style="padding:5px 0;font-size:13px"><a href="tel:${contactPhone}" style="color:#639922">${contactPhone}</a></td></tr>` : ""}
      </table>
      ${notes ? `<div style="margin-top:12px;padding-top:12px;border-top:1px solid #D3D1C7;font-size:12px;color:#5F5E5A;font-style:italic">"${notes}"</div>` : ""}
    </div>
    <a href="${appUrl}/dashboard/bookings" style="display:block;background:#639922;color:#fff;text-decoration:none;padding:14px 20px;border-radius:10px;font-size:14px;font-weight:700;text-align:center;margin-bottom:12px">Review & respond to this request →</a>
    <p style="font-size:12px;color:#5F5E5A;text-align:center;margin:0">Approving will automatically add this to your schedule.</p>
  </div>
  <div style="background:#f8f8f6;padding:16px 36px;text-align:center;border-top:1px solid #D3D1C7"><p style="font-size:11px;color:#5F5E5A;margin:0">VendorBeacon · <a href="${appUrl}" style="color:#639922">vendorbeacon.app</a></p></div>
</div></body></html>`,
      });
    } catch { /* swallow */ }
  }

  return NextResponse.json({ id: booking.id }, { status: 201 });
}
