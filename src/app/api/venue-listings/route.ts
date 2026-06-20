import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { Resend } from "resend";

const VENUE_TYPES = ["brewery","apartment","office","shopping","park","event_space","church","school","private","other"] as const;

function slugify(input: string): string {
  return input.toLowerCase().trim().replace(/[^a-z0-9\s-]/g, "").replace(/\s+/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "");
}

async function verifyTurnstile(token: string, ip: string): Promise<boolean> {
  if (!process.env.TURNSTILE_SECRET_KEY) return true; // skip if not configured
  try {
    const res = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ secret: process.env.TURNSTILE_SECRET_KEY, response: token, remoteip: ip }),
    });
    const data = await res.json();
    return data.success === true;
  } catch {
    return false;
  }
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const {
    venueName, venueType, venueTypeCustom, address, city, zipCode,
    daysAvailable, hoursAvailable, description, maxTrucks,
    expectedTraffic, parkingDetails,
    hasElectrical, hasWater, hasRestrooms,
    vendorFee, requiresPermit, requiresInsurance,
    websiteUrl, instagramUrl, facebookUrl,
    contactName, contactEmail, contactPhone,
    turnstileToken,
  } = body;

  const required = { venueName, venueType, address, city, daysAvailable, hoursAvailable, description, contactName, contactEmail };
  for (const [key, value] of Object.entries(required)) {
    if (!value?.toString().trim()) return NextResponse.json({ error: `Missing required field: ${key}` }, { status: 400 });
  }

  if (!VENUE_TYPES.includes(venueType)) return NextResponse.json({ error: "Invalid venue type" }, { status: 400 });

  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailPattern.test(contactEmail)) return NextResponse.json({ error: "Invalid email address" }, { status: 400 });

  // CAPTCHA verification
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0] ?? req.headers.get("x-real-ip") ?? "unknown";
  if (process.env.TURNSTILE_SECRET_KEY) {
    if (!turnstileToken) return NextResponse.json({ error: "Please complete the verification challenge." }, { status: 400 });
    const captchaValid = await verifyTurnstile(turnstileToken, ip);
    if (!captchaValid) return NextResponse.json({ error: "Verification failed. Please try again." }, { status: 400 });
  }

  const supabase = createServiceClient();

  const baseSlug = slugify(venueName) || "venue";
  let slug = baseSlug;
  let attempt = 0;
  while (attempt < 5) {
    const { data: existing } = await supabase.from("venue_listings").select("id").eq("slug", slug).maybeSingle();
    if (!existing) break;
    attempt++;
    slug = `${baseSlug}-${Math.floor(Math.random() * 9000) + 1000}`;
  }

  const finalDescription = venueType === "other" && venueTypeCustom
    ? `Venue type: ${venueTypeCustom}\n\n${description}`
    : description;

  // Listing is created but NOT published until email is verified.
  // edit_token_expires_at set 90 days out from creation.
  const { data: listing, error } = await supabase.from("venue_listings").insert({
    venue_name: venueName, venue_type: venueType, address, city,
    zip_code: zipCode || null,
    days_available: daysAvailable, hours_available: hoursAvailable,
    description: finalDescription,
    max_trucks: parseInt(maxTrucks) || 1,
    expected_traffic: expectedTraffic || null,
    parking_details: parkingDetails || null,
    has_electrical: hasElectrical ?? false,
    has_water: hasWater ?? false,
    has_restrooms: hasRestrooms ?? false,
    vendor_fee: vendorFee || null,
    requires_permit: requiresPermit ?? false,
    requires_insurance: requiresInsurance ?? false,
    website_url: websiteUrl || null,
    instagram_url: instagramUrl || null,
    facebook_url: facebookUrl || null,
    contact_name: contactName, contact_email: contactEmail,
    contact_phone: contactPhone || null,
    slug,
    is_published: false,       // stays unpublished until verified
    email_verified: false,
    verification_sent_at: new Date().toISOString(),
    edit_token_expires_at: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(),
  }).select().single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://vendorbeacon.app";

  if (process.env.RESEND_API_KEY && contactEmail) {
    try {
      const resend = new Resend(process.env.RESEND_API_KEY);
      const verifyUrl = `${appUrl}/api/venue-listings/verify?token=${listing.verification_token}`;

      await resend.emails.send({
        from: process.env.BOOKING_NOTIFICATION_FROM_EMAIL ?? "VendorBeacon <notifications@vendorbeacon.app>",
        to: contactEmail,
        subject: `Confirm your venue listing — ${venueName}`,
        html: `<!DOCTYPE html><html><head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background:#f0f0ee;font-family:-apple-system,sans-serif;">
<div style="max-width:520px;margin:40px auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,.08)">
  <div style="background:#639922;padding:28px 36px;text-align:center"><div style="font-size:22px;font-weight:800;color:#fff">VendorBeacon</div></div>
  <div style="padding:32px 36px">
    <h1 style="font-size:20px;font-weight:700;color:#2C2C2A;margin:0 0 8px">One more step ✉️</h1>
    <p style="font-size:14px;color:#5F5E5A;margin:0 0 20px;line-height:1.6">
      Confirm this email address to publish <strong>${venueName}</strong> on the VendorBeacon venue board. This keeps the board free of spam and fake listings.
    </p>
    <a href="${verifyUrl}" style="display:block;background:#639922;color:#fff;text-decoration:none;padding:14px 20px;border-radius:10px;font-size:14px;font-weight:700;text-align:center;margin-bottom:16px">
      Confirm & publish my listing →
    </a>
    <p style="font-size:12px;color:#5F5E5A;text-align:center;margin:0">
      If you didn't submit this listing, you can safely ignore this email.
    </p>
  </div>
  <div style="background:#f8f8f6;padding:16px 36px;text-align:center;border-top:1px solid #D3D1C7">
    <p style="font-size:11px;color:#5F5E5A;margin:0">VendorBeacon · <a href="${appUrl}" style="color:#639922;text-decoration:none">vendorbeacon.app</a></p>
  </div>
</div></body></html>`,
      });
    } catch (err) {
      console.error("Verification email error:", err);
    }
  }

  return NextResponse.json({ id: listing.id, slug: listing.slug, pendingVerification: true }, { status: 201 });
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const venueType = searchParams.get("type");
  const city = searchParams.get("city");
  const supabase = createServiceClient();

  let query = supabase
    .from("venue_listings")
    .select("id, venue_name, venue_type, city, slug, days_available, hours_available, description, max_trucks, has_electrical, has_water, has_restrooms, vendor_fee, requires_permit, requires_insurance, expected_traffic, created_at")
    .eq("is_approved", true)
    .eq("is_published", true)
    .eq("email_verified", true)
    .order("created_at", { ascending: false });

  if (venueType && venueType !== "all") query = query.eq("venue_type", venueType);
  if (city) query = query.ilike("city", `%${city}%`);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ listings: data });
}
