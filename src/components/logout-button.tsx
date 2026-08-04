"use client";

import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

export function LogoutButton() {
  const router = useRouter();

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  }

  return (
    <button onClick={handleLogout}
      className="text-xs px-3 py-1.5 rounded-lg transition"
      style={{ color: "#888", background: "transparent", border: "0.5px solid #333" }}>
      Log out
    </button>
  );
}
