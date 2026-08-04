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
    <button onClick={handleLogout} style={{
      background: "rgba(10,42,10,0.12)", border: "none", cursor: "pointer",
      color: "var(--green-dark)", fontSize: 12, fontWeight: 700,
      padding: "6px 14px", borderRadius: 9999, transition: "background 150ms ease",
    }}>
      Log out
    </button>
  );
}
