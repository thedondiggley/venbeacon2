import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/server";

export async function DELETE(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const serviceClient = createServiceClient();

    // Delete vendor record (cascades to all related data via FK constraints)
    await serviceClient.from("vendors").delete().eq("user_id", user.id);

    // Delete the auth user account
    await serviceClient.auth.admin.deleteUser(user.id);

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Account delete error:", err);
    return NextResponse.json({ error: "Failed to delete account" }, { status: 500 });
  }
}
