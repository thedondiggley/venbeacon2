import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { enforcePro, handleApiError } from "@/lib/subscription";

// Pro-only endpoint to reveal venue contact info
// This enforces at API level that free users can't get contact details
export async function POST(req: NextRequest) {
  try {
    const vendor = await enforcePro();
    const { venueId } = await req.json();

    if (!venueId) {
      return NextResponse.json({ error: "venueId required" }, { status: 400 });
    }

    const supabase = createServiceClient();
    const { data: venue } = await supabase
      .from("venue_listings")
      .select("contact_name, contact_email, contact_phone")
      .eq("id", venueId)
      .eq("is_approved", true)
      .single();

    if (!venue) {
      return NextResponse.json({ error: "Venue not found" }, { status: 404 });
    }

    // Track analytics event
    await supabase.from("analytics_events").insert({
      vendor_id: vendor.id,
      event_type: "venue_contact_reveal",
      metadata: { venue_id: venueId },
    });

    return NextResponse.json(venue);
  } catch (err) {
    return handleApiError(err);
  }
}
