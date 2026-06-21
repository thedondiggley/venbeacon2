import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { createClient } from "@/lib/supabase/server";

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS ?? "").split(",").map(e => e.trim().toLowerCase());

async function isAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  return user && ADMIN_EMAILS.includes(user.email?.toLowerCase() ?? "");
}

export async function PATCH(req: NextRequest) {
  if (!await isAdmin()) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

  const { id, disabled } = await req.json();
  if (!id || typeof disabled !== "boolean") {
    return NextResponse.json({ error: "Missing id or disabled flag" }, { status: 400 });
  }

  const supabase = createServiceClient();
  const { error } = await supabase.from("vendors").update({ disabled }).eq("id", id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest) {
  if (!await isAdmin()) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

  const { id } = await req.json();
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  const supabase = createServiceClient();

  // Get the auth user_id before deleting the vendor row
  const { data: vendor } = await supabase.from("vendors").select("user_id").eq("id", id).single();

  // Delete the vendor record (cascades to locations, bookings, etc. via FK constraints)
  const { error: deleteError } = await supabase.from("vendors").delete().eq("id", id);
  if (deleteError) return NextResponse.json({ error: deleteError.message }, { status: 500 });

  // Also delete their auth account so the email can sign up fresh if needed
  if (vendor?.user_id) {
    await supabase.auth.admin.deleteUser(vendor.user_id).catch(() => {});
  }

  return NextResponse.json({ ok: true });
}
