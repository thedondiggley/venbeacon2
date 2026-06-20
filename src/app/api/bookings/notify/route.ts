import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { Resend } from "resend";

function formatDate(d: string) {
  return new Date(d + "T12:00:00").toLocaleDateString(undefined, {
    weekday: "long", month: "long", day: "numeric", year: "numeric"
  });
}

function formatTime(t: string) {
  const [h, m] = t.split(":").map(Number);
  const ap = h >= 12 ? "PM" : "AM";
  const h12 = h > 12 ? h - 12 : h === 0 ? 12 : h;
  return `${h12}:${m.toString().padStart(2, "0")} ${ap}`;
}

export async function POST(req: NextRequest) {
  try {
    const { bookingId, action } = await req.json();

    if (!bookingId || !["approved", "declined"].includes(action)) {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }

    if (!process.env.RESEND_API_KEY) {
      return NextResponse.json({ ok: true, skipped: "no resend key" });
    }

    const supabase = createServiceClient();

    const { data: booking } = await supabase
      .from("bookings")
      .select("*, vendors(business_name, slug, contact_email)")
      .eq("id", bookingId)
      .single();

    if (!booking) return NextResponse.json({ error: "Booking not found" }, { status: 404 });

    const vendor = booking.vendors as { business_name: string; slug: string; contact_email: string };
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://vendorbeacon.app";
    const resend = new Resend(process.env.RESEND_API_KEY);
    const from = process.env.BOOKING_NOTIFICATION_FROM_EMAIL ?? "VendorBeacon <notifications@vendorbeacon.app>";

    if (action === "approved") {
      await resend.emails.send({
        from,
        to: booking.contact_email,
        subject: `Your booking request was approved — ${vendor.business_name}`,
        html: `<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#f0f0ee;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
<div style="max-width:540px;margin:40px auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,.08)">
  <div style="background:#639922;padding:28px 36px">
    <div style="font-size:22px;font-weight:800;color:#fff">VendorBeacon</div>
    <div style="font-size:14px;color:rgba(255,255,255,.85);margin-top:4px">Booking approved</div>
  </div>
  <div style="padding:32px 36px">
    <div style="font-size:32px;text-align:center;margin-bottom:16px">🎉</div>
    <h1 style="font-size:20px;font-weight:700;color:#2C2C2A;margin:0 0 8px;text-align:center">Your booking was approved!</h1>
    <p style="font-size:14px;color:#5F5E5A;margin:0 0 24px;line-height:1.6;text-align:center">
      <strong>${vendor.business_name}</strong> has approved your booking request for <strong>${booking.venue_name}</strong>.
    </p>

    <div style="background:#EAF3DE;border-radius:10px;padding:20px;margin-bottom:24px">
      <div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.06em;color:#3B6D11;margin-bottom:14px">Booking details</div>
      <table style="width:100%;border-collapse:collapse">
        <tr><td style="padding:6px 0;color:#5F5E5A;font-size:13px;width:40%">Truck</td><td style="padding:6px 0;font-size:13px;font-weight:600;color:#2C2C2A">${vendor.business_name}</td></tr>
        <tr><td style="padding:6px 0;color:#5F5E5A;font-size:13px">Venue</td><td style="padding:6px 0;font-size:13px;color:#2C2C2A">${booking.venue_name}</td></tr>
        <tr><td style="padding:6px 0;color:#5F5E5A;font-size:13px">Date</td><td style="padding:6px 0;font-size:13px;font-weight:600;color:#2C2C2A">${formatDate(booking.event_date)}</td></tr>
        <tr><td style="padding:6px 0;color:#5F5E5A;font-size:13px">Time</td><td style="padding:6px 0;font-size:13px;color:#2C2C2A">${formatTime(booking.start_time)} – ${formatTime(booking.end_time)}</td></tr>
        <tr><td style="padding:6px 0;color:#5F5E5A;font-size:13px">Address</td><td style="padding:6px 0;font-size:13px;color:#2C2C2A">${booking.venue_address}</td></tr>
      </table>
    </div>

    <div style="border:1px solid #D3D1C7;border-radius:10px;padding:18px;margin-bottom:24px">
      <p style="font-size:13px;color:#5F5E5A;margin:0;line-height:1.6">
        The truck will be at your venue at the scheduled time. If you need to make any changes or have questions, reach out directly to <strong>${vendor.business_name}</strong> by visiting their page below.
      </p>
    </div>

    <a href="${appUrl}/t/${vendor.slug}" style="display:block;background:#639922;color:#fff;text-decoration:none;padding:14px 20px;border-radius:10px;font-size:14px;font-weight:700;text-align:center;margin-bottom:12px">
      View ${vendor.business_name}'s page →
    </a>
  </div>
  <div style="background:#f8f8f6;padding:16px 36px;text-align:center;border-top:1px solid #D3D1C7">
    <p style="font-size:11px;color:#5F5E5A;margin:0">VendorBeacon · <a href="${appUrl}" style="color:#639922;text-decoration:none">vendorbeacon.app</a></p>
  </div>
</div>
</body>
</html>`,
      });
    }

    if (action === "declined") {
      await resend.emails.send({
        from,
        to: booking.contact_email,
        subject: `Update on your booking request — ${vendor.business_name}`,
        html: `<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#f0f0ee;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
<div style="max-width:540px;margin:40px auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,.08)">
  <div style="background:#2C2C2A;padding:28px 36px">
    <div style="font-size:22px;font-weight:800;color:#fff">VendorBeacon</div>
    <div style="font-size:14px;color:rgba(255,255,255,.7);margin-top:4px">Booking update</div>
  </div>
  <div style="padding:32px 36px">
    <h1 style="font-size:20px;font-weight:700;color:#2C2C2A;margin:0 0 8px">Booking request update</h1>
    <p style="font-size:14px;color:#5F5E5A;margin:0 0 24px;line-height:1.6">
      Unfortunately <strong>${vendor.business_name}</strong> is unable to fulfill your booking request for <strong>${booking.venue_name}</strong> on <strong>${formatDate(booking.event_date)}</strong> at this time.
    </p>

    <div style="border:1px solid #D3D1C7;border-radius:10px;padding:18px;margin-bottom:24px">
      <p style="font-size:13px;color:#5F5E5A;margin:0;line-height:1.6">
        This could be because the date is already booked, they are unavailable in your area, or the timing doesn't work out. We recommend reaching out to other food truck operators on VendorBeacon for your event.
      </p>
    </div>

    <a href="${appUrl}" style="display:block;background:#639922;color:#fff;text-decoration:none;padding:14px 20px;border-radius:10px;font-size:14px;font-weight:700;text-align:center;margin-bottom:12px">
      Find other food trucks on VendorBeacon →
    </a>
    <p style="font-size:12px;color:#5F5E5A;text-align:center;margin:0">
      You can also list your venue on VendorBeacon so trucks can find and reach out to you directly.
    </p>
  </div>
  <div style="background:#f8f8f6;padding:16px 36px;text-align:center;border-top:1px solid #D3D1C7">
    <p style="font-size:11px;color:#5F5E5A;margin:0">VendorBeacon · <a href="${appUrl}" style="color:#639922;text-decoration:none">vendorbeacon.app</a></p>
  </div>
</div>
</body>
</html>`,
      });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Booking notify error:", err);
    return NextResponse.json({ error: "Failed to send notification" }, { status: 500 });
  }
}
