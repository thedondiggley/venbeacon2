import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
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
  if (!checkRateLimit(ip)) return NextResponse.json({ error: "Too many requests. Please wait before trying again." }, { status: 429 });

  const { email, venueName } = await req.json();
  if (!email?.trim()) return NextResponse.json({ error: "Email is required." }, { status: 400 });

  const supabase = createServiceClient();

  // Find listing(s) matching this email (and optionally venue name to narrow it down)
  let query = supabase.from("venue_listings").select("id, venue_name, contact_email, edit_token").eq("contact_email", email);
  if (venueName?.trim()) query = query.ilike("venue_name", `%${venueName}%`);

  const { data: listings } = await query;

  // Always return success regardless of match — don't leak which emails have listings
  if (listings && listings.length > 0 && process.env.RESEND_API_KEY) {
    const resend = new Resend(process.env.RESEND_API_KEY);
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://vendorbeacon.app";
    const newExpiry = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString();

    for (const listing of listings) {
      // Rotate to a fresh random token and extend expiration
      const { data: updated } = await supabase
        .from("venue_listings")
        .update({ edit_token: undefined, edit_token_expires_at: newExpiry })
        .eq("id", listing.id)
        .select("edit_token")
        .single();

      // If edit_token has a DB default of gen_random_uuid(), we need to explicitly regenerate.
      // Safer: generate here and set explicitly.
      const { randomUUID } = await import("crypto");
      const freshToken = randomUUID();

      await supabase.from("venue_listings").update({ edit_token: freshToken, edit_token_expires_at: newExpiry }).eq("id", listing.id);

      const editUrl = `${appUrl}/venue/edit/${freshToken}`;

      await resend.emails.send({
        from: process.env.BOOKING_NOTIFICATION_FROM_EMAIL ?? "VendorBeacon <notifications@vendorbeacon.app>",
        to: email,
        subject: `Your new edit link — ${listing.venue_name}`,
        html: `<!DOCTYPE html><html><head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background:#f0f0ee;font-family:-apple-system,sans-serif;">
<div style="max-width:520px;margin:40px auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,.08)">
  <div style="background:#639922;padding:28px 36px;text-align:center"><div style="font-size:22px;font-weight:800;color:#fff">VendorBeacon</div></div>
  <div style="padding:32px 36px">
    <h1 style="font-size:20px;font-weight:700;color:#2C2C2A;margin:0 0 8px">Here's your new edit link</h1>
    <p style="font-size:14px;color:#5F5E5A;margin:0 0 20px;line-height:1.6">Your previous link for <strong>${listing.venue_name}</strong> expired. Use this new link to edit or remove your listing — valid for 90 days.</p>
    <a href="${editUrl}" style="display:block;background:#2C2C2A;color:#fff;text-decoration:none;padding:14px 20px;border-radius:10px;font-size:14px;font-weight:700;text-align:center">Edit my listing →</a>
  </div>
  <div style="background:#f8f8f6;padding:16px 36px;text-align:center;border-top:1px solid #D3D1C7"><p style="font-size:11px;color:#5F5E5A;margin:0">VendorBeacon · <a href="${appUrl}" style="color:#639922">vendorbeacon.app</a></p></div>
</div></body></html>`,
      }).catch(() => {});
    }
  }

  return NextResponse.json({ ok: true, message: "If a listing was found, a new edit link has been sent to that email." });
}
