import { createServiceClient } from "@/lib/supabase/server";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import AdminDashboard from "./dashboard";

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS ?? "").split(",").map(e => e.trim().toLowerCase());

export default async function AdminPage() {
  // Use the session-aware client to check who's actually logged in
  const sessionClient = await createClient();
  const { data: { user } } = await sessionClient.auth.getUser();

  if (!user || !ADMIN_EMAILS.includes(user.email?.toLowerCase() ?? "")) {
    redirect("/dashboard");
  }

  // Use the service-role client to fetch all platform data, bypassing RLS
  const supabase = createServiceClient();

  // Fetch all platform data
  const [
    { data: vendors, count: vendorCount },
    { data: venues, count: venueCount },
    { data: bookings, count: bookingCount },
    { data: recentVendors },
    { data: recentVenues },
  ] = await Promise.all([
    supabase.from("vendors").select("*", { count: "exact" }).order("created_at", { ascending: false }),
    supabase.from("venue_listings").select("*", { count: "exact" }).order("created_at", { ascending: false }),
    supabase.from("bookings").select("*", { count: "exact" }).order("created_at", { ascending: false }),
    supabase.from("vendors").select("id, business_name, contact_email, is_pro, created_at, slug").order("created_at", { ascending: false }).limit(10),
    supabase.from("venue_listings").select("id, venue_name, city, venue_type, is_approved, is_published, created_at, slug").order("created_at", { ascending: false }).limit(10),
  ]);

  const proVendors = vendors?.filter(v => v.is_pro).length ?? 0;
  const pendingVenues = venues?.filter(v => !v.is_approved).length ?? 0;

  return (
    <AdminDashboard
      stats={{ vendorCount: vendorCount ?? 0, venueCount: venueCount ?? 0, bookingCount: bookingCount ?? 0, proVendors, pendingVenues }}
      vendors={vendors ?? []}
      venues={venues ?? []}
      bookings={bookings ?? []}
      recentVendors={recentVendors ?? []}
      recentVenues={recentVenues ?? []}
    />
  );
}
