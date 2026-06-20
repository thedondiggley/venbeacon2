import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requirePro, handleApiError, ApiError } from "@/lib/subscription";

type Params = { params: Promise<{ id: string }> };

export async function PATCH(req: NextRequest, { params }: Params) {
  try {
    const { vendor } = await requirePro();
    const { id } = await params;
    const body = await req.json();

    const supabase = await createClient();

    // Verify ownership
    const { data: existing } = await supabase
      .from("locations")
      .select("vendor_id")
      .eq("id", id)
      .single();

    if (!existing || existing.vendor_id !== vendor.id) {
      throw new ApiError(403, "Forbidden");
    }

    const { data, error } = await supabase
      .from("locations")
      .update({
        title: body.title,
        address: body.address ?? null,
        start_time: body.start_time,
        end_time: body.end_time,
        notes: body.notes ?? null,
      })
      .eq("id", id)
      .select()
      .single();

    if (error) throw new ApiError(500, error.message);
    return NextResponse.json(data);
  } catch (err) {
    return handleApiError(err);
  }
}

export async function DELETE(req: NextRequest, { params }: Params) {
  try {
    const { vendor } = await requirePro();
    const { id } = await params;

    const supabase = await createClient();

    const { data: existing } = await supabase
      .from("locations")
      .select("vendor_id")
      .eq("id", id)
      .single();

    if (!existing || existing.vendor_id !== vendor.id) {
      throw new ApiError(403, "Forbidden");
    }

    const { error } = await supabase.from("locations").delete().eq("id", id);
    if (error) throw new ApiError(500, error.message);

    return new NextResponse(null, { status: 204 });
  } catch (err) {
    return handleApiError(err);
  }
}
