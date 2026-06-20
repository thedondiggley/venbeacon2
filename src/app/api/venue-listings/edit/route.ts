import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { Resend } from "resend";

function isExpired(expiresAt: string | null): boolean {
  if (!expiresAt) return false; // null = no expiration set (legacy rows), treat as valid
  return new Date(expiresAt).getTime() < Date.now();
}

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("token");
  if (!token) return NextResponse.json({ error: "Missing token" }, { status: 400 });

  const supabase = createServiceClient();
  const { data: venue } = await supabase
    .from("venue_listings")
    .select("*")
    .eq("edit_token", token)
    .single();

  if (!venue) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (isExpired(venue.edit_token_expires_at)) {
    return NextResponse.json({ error: "expired", message: "This edit link has expired. Request a new one below." }, { status: 410 });
  }

  return NextResponse.json({ venue });
}

export async function PATCH(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("token");
  if (!token) return NextResponse.json({ error: "Missing token" }, { status: 400 });

  const body = await req.json();
  const {
    venueName, venueType, venueTypeCustom, address, city,
    daysAvailable, hoursAvailable, description, maxTrucks,
    contactName, contactEmail, contactPhone,
  } = body;

  const supabase = createServiceClient();

  const { data: existing } = await supabase
    .from("venue_listings")
    .select("id, edit_token_expires_at")
    .eq("edit_token", token)
    .single();

  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (isExpired(existing.edit_token_expires_at)) {
    return NextResponse.json({ error: "expired", message: "This edit link has expired. Request a new one below." }, { status: 410 });
  }

  const finalDescription = venueType === "other" && venueTypeCustom
    ? `Venue type: ${venueTypeCustom}\n\n${description}`
    : description;

  const { error } = await supabase
    .from("venue_listings")
    .update({
      venue_name: venueName,
      venue_type: venueType,
      address,
      city,
      days_available: daysAvailable,
      hours_available: hoursAvailable,
      description: finalDescription,
      max_trucks: parseInt(maxTrucks) || 1,
      contact_name: contactName,
      contact_email: contactEmail,
      contact_phone: contactPhone || null,
    })
    .eq("edit_token", token);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("token");
  if (!token) return NextResponse.json({ error: "Missing token" }, { status: 400 });

  const supabase = createServiceClient();

  const { data: existing } = await supabase
    .from("venue_listings")
    .select("id, edit_token_expires_at")
    .eq("edit_token", token)
    .single();

  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (isExpired(existing.edit_token_expires_at)) {
    return NextResponse.json({ error: "expired", message: "This edit link has expired. Request a new one below." }, { status: 410 });
  }

  const { error } = await supabase
    .from("venue_listings")
    .delete()
    .eq("edit_token", token);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
