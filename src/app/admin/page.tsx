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
    { data: feedback, count: feedbackCount },
    { data: funnelEvents },
  ] = await Promise.all([
    supabase.from("vendors").select("*", { count: "exact" }).order("created_at", { ascending: false }),
    supabase.from("venue_listings").select("*", { count: "exact" }).order("created_at", { ascending: false }),
    supabase.from("bookings").select("*", { count: "exact" }).order("created_at", { ascending: false }),
    supabase.from("vendors").select("id, business_name, contact_email, is_pro, created_at, slug").order("created_at", { ascending: false }).limit(10),
    supabase.from("venue_listings").select("id, venue_name, city, venue_type, is_approved, is_published, created_at, slug").order("created_at", { ascending: false }).limit(10),
    supabase.from("feedback").select("*", { count: "exact" }).order("created_at", { ascending: false }),
    supabase.from("analytics_events").select("event_type, metadata").like("event_type", "onboarding_%"),
  ]);

  const proVendors = vendors?.filter(v => v.is_pro).length ?? 0;
  const pendingVenues = venues?.filter(v => !v.is_approved).length ?? 0;
  const newFeedback = feedback?.filter(f => f.status === "new").length ?? 0;

  // Aggregate onboarding funnel: count of unique step-reached events by step number
  const stepReachedCounts: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0 };
  let step3Skipped = 0;
  let completed = 0;

  for (const ev of funnelEvents ?? []) {
    if (ev.event_type === "onboarding_step_reached") {
      const stepNum = (ev.metadata as any)?.step;
      if (stepNum && stepReachedCounts[stepNum] !== undefined) stepReachedCounts[stepNum]++;
    }
    if (ev.event_type === "onboarding_step_skipped") {
      const stepNum = (ev.metadata as any)?.step;
      if (stepNum === 3) step3Skipped++;
    }
    if (ev.event_type === "onboarding_completed") completed++;
  }

  const funnel = { stepReachedCounts, step3Skipped, completed };

  return (
    <AdminDashboard
      stats={{ vendorCount: vendorCount ?? 0, venueCount: venueCount ?? 0, bookingCount: bookingCount ?? 0, proVendors, pendingVenues, feedbackCount: feedbackCount ?? 0, newFeedback }}
      vendors={vendors ?? []}
      venues={venues ?? []}
      bookings={bookings ?? []}
      recentVendors={recentVendors ?? []}
      recentVenues={recentVenues ?? []}
      feedback={feedback ?? []}
      funnel={funnel}
    />
  );
}
