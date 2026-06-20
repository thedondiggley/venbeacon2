import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requirePro, checkScheduleLimit, handleApiError, ApiError } from "@/lib/subscription";

export async function POST(req: NextRequest) {
  try {
    const { vendor, isPro } = await requirePro();
    const body = await req.json();
    const { title, address, start_time, end_time, notes } = body;

    if (!title || !start_time || !end_time) {
      throw new ApiError(400, "Title, start time, and end time are required");
    }

    // Enforce free plan 3-entry limit at API layer
    const limit = await checkScheduleLimit(vendor.id, isPro);
    if (!limit.allowed) {
      throw new ApiError(403, "Free plan allows up to 3 active schedule entries. Upgrade to Pro for unlimited entries.");
    }

    const supabase = await createClient();
    const { data, error } = await supabase
      .from("locations")
      .insert({
        vendor_id: vendor.id,
        title,
        address: address || null,
        start_time,
        end_time,
        notes: notes || null,
        source: "manual",
      })
      .select()
      .single();

    if (error) throw new ApiError(500, error.message);

    return NextResponse.json(data, { status: 201 });
  } catch (err) {
    return handleApiError(err);
  }
}
