import { getCurrentVendor } from "@/lib/vendor";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";

export default async function DashboardHome() {
  const vendor = await getCurrentVendor();
  const supabase = await createClient();

  // Upcoming stops
  const { data: locations } = await supabase
    .from("locations")
    .select("id, title, start_time, end_time, address")
    .eq("vendor_id", vendor.id)
    .gte("start_time", new Date().toISOString())
    .order("start_time", { ascending: true })
    .limit(3);

  // Pending bookings (Pro only)
  let pendingCount = 0;
  let recentBookings: { id: string; venue_name: string; event_date: string }[] = [];
  if (vendor.is_pro) {
    const { count } = await supabase
      .from("bookings")
      .select("id", { count: "exact", head: true })
      .eq("vendor_id", vendor.id)
      .eq("status", "pending");
    pendingCount = count ?? 0;

    const { data: recent } = await supabase
      .from("bookings")
      .select("id, venue_name, event_date")
      .eq("vendor_id", vendor.id)
      .eq("status", "pending")
      .order("created_at", { ascending: false })
      .limit(3);
    recentBookings = recent ?? [];
  }

  // Profile completion
  const profileFields = [
    vendor.description,
    vendor.contact_phone,
    vendor.logo_url,
    vendor.instagram_url || vendor.facebook_url || vendor.tiktok_url,
  ];
  const completedFields = profileFields.filter(Boolean).length;
  const profilePercent = Math.round((completedFields / profileFields.length) * 100);
  const isProfileComplete = profilePercent === 100;

  function formatDate(d: string) {
    return new Date(d + "T12:00:00").toLocaleDateString(undefined, {
      weekday: "short", month: "short", day: "numeric"
    });
  }

  function formatTime(t: string) {
    const d = new Date(t);
    return d.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
  }

  const isNewAccount = !vendor.description && !vendor.contact_phone && !vendor.instagram_url;

  return (
    <div className="space-y-6">
      {/* Welcome banner for new accounts */}
      {isNewAccount && (
        <div className="rounded-xl border p-5" style={{ background: "var(--brand-green-light)", borderColor: "#a8cf72" }}>
          <p className="text-sm font-semibold mb-1" style={{ color: "var(--brand-green-dark)" }}>
            Welcome to VendorBeacon! 👋
          </p>
          <p className="text-sm mb-3" style={{ color: "var(--brand-green-dark)", opacity: 0.9 }}>
            Your public page is live. Complete your profile and add your first stop to get started.
          </p>
          <div className="flex gap-2 flex-wrap">
            <Link href="/dashboard/schedule"
              className="text-xs font-semibold px-3 py-1.5 rounded-lg text-white"
              style={{ background: "var(--brand-green)" }}>
              Add a stop
            </Link>
            <Link href="/dashboard/settings"
              className="text-xs font-semibold px-3 py-1.5 rounded-lg border"
              style={{ borderColor: "var(--brand-green)", color: "var(--brand-green-dark)", background: "#fff" }}>
              Complete profile
            </Link>
          </div>
        </div>
      )}

      {/* Pending bookings alert */}
      {vendor.is_pro && pendingCount > 0 && (
        <Link href="/dashboard/bookings"
          className="block rounded-xl border p-4 hover:bg-gray-50 transition"
          style={{ borderColor: "#a8cf72", background: "var(--brand-green-light)" }}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-xl">📥</span>
              <div>
                <p className="text-sm font-semibold" style={{ color: "var(--brand-green-dark)" }}>
                  {pendingCount} pending booking {pendingCount === 1 ? "request" : "requests"}
                </p>
                <p className="text-xs mt-0.5" style={{ color: "var(--brand-green-dark)", opacity: 0.8 }}>
                  Tap to review and respond
                </p>
              </div>
            </div>
            <span style={{ color: "var(--brand-green-dark)", fontSize: "18px" }}>›</span>
          </div>
        </Link>
      )}

      {/* Stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="rounded-xl border p-4 text-center" style={{ borderColor: "var(--brand-line)" }}>
          <div className="text-2xl font-bold mb-1" style={{ color: "var(--brand-green)" }}>
            {locations?.length ?? 0}
          </div>
          <div className="text-xs" style={{ color: "var(--brand-charcoal-soft)" }}>Upcoming stops</div>
        </div>
        <div className="rounded-xl border p-4 text-center" style={{ borderColor: "var(--brand-line)" }}>
          <div className="text-2xl font-bold mb-1" style={{ color: vendor.is_pro ? "var(--brand-green)" : "var(--brand-charcoal-soft)" }}>
            {vendor.is_pro ? pendingCount : "—"}
          </div>
          <div className="text-xs" style={{ color: "var(--brand-charcoal-soft)" }}>Pending bookings</div>
        </div>
        <div className="rounded-xl border p-4 text-center" style={{ borderColor: "var(--brand-line)" }}>
          <div className="text-2xl font-bold mb-1" style={{ color: "var(--brand-green)" }}>
            {profilePercent}%
          </div>
          <div className="text-xs" style={{ color: "var(--brand-charcoal-soft)" }}>Profile complete</div>
        </div>
        <div className="rounded-xl border p-4 text-center" style={{ borderColor: "var(--brand-line)" }}>
          <div className="text-2xl font-bold mb-1" style={{ color: vendor.is_pro ? "var(--brand-green)" : "var(--brand-charcoal-soft)" }}>
            {vendor.is_pro ? "Pro" : "Free"}
          </div>
          <div className="text-xs" style={{ color: "var(--brand-charcoal-soft)" }}>Current plan</div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Upcoming stops */}
        <div className="rounded-xl border p-4" style={{ borderColor: "var(--brand-line)" }}>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold">Upcoming stops</h2>
            <Link href="/dashboard/schedule" className="text-xs underline"
              style={{ color: "var(--brand-green-dark)" }}>
              Manage
            </Link>
          </div>
          {!locations || locations.length === 0 ? (
            <div className="text-center py-4">
              <p className="text-sm mb-2" style={{ color: "var(--brand-charcoal-soft)" }}>No upcoming stops.</p>
              <Link href="/dashboard/schedule"
                className="text-xs font-medium underline" style={{ color: "var(--brand-green-dark)" }}>
                Add your first stop →
              </Link>
            </div>
          ) : (
            <div className="space-y-2">
              {locations.map(loc => {
                const isToday = new Date(loc.start_time).toDateString() === new Date().toDateString();
                return (
                  <div key={loc.id} className="flex items-start gap-3 py-2 border-b last:border-0"
                    style={{ borderColor: "var(--brand-line)" }}>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium truncate">{loc.title}</p>
                        {isToday && (
                          <span className="text-xs px-1.5 py-0.5 rounded-full text-white shrink-0"
                            style={{ background: "var(--brand-green)", fontSize: "10px" }}>
                            Today
                          </span>
                        )}
                      </div>
                      <p className="text-xs mt-0.5" style={{ color: "var(--brand-charcoal-soft)" }}>
                        {formatTime(loc.start_time)} – {formatTime(loc.end_time)}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Pending bookings or upgrade prompt */}
        <div className="rounded-xl border p-4" style={{ borderColor: "var(--brand-line)" }}>
          {vendor.is_pro ? (
            <>
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-sm font-semibold">Recent booking requests</h2>
                <Link href="/dashboard/bookings" className="text-xs underline"
                  style={{ color: "var(--brand-green-dark)" }}>
                  View all
                </Link>
              </div>
              {recentBookings.length === 0 ? (
                <div className="text-center py-4">
                  <p className="text-sm" style={{ color: "var(--brand-charcoal-soft)" }}>
                    No pending requests.
                  </p>
                  <p className="text-xs mt-1" style={{ color: "var(--brand-charcoal-soft)" }}>
                    Share your public page link to start receiving requests.
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {recentBookings.map(b => (
                    <Link key={b.id} href="/dashboard/bookings"
                      className="flex items-center justify-between py-2 border-b last:border-0 hover:opacity-75 transition"
                      style={{ borderColor: "var(--brand-line)" }}>
                      <div>
                        <p className="text-sm font-medium">{b.venue_name}</p>
                        <p className="text-xs mt-0.5" style={{ color: "var(--brand-charcoal-soft)" }}>
                          {formatDate(b.event_date)}
                        </p>
                      </div>
                      <span className="text-xs px-2 py-0.5 rounded-full font-medium"
                        style={{ background: "#FEF9C3", color: "#854D0E" }}>
                        Pending
                      </span>
                    </Link>
                  ))}
                </div>
              )}
            </>
          ) : (
            <>
              <h2 className="text-sm font-semibold mb-3">Grow your business</h2>
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <span className="text-lg">🏢</span>
                  <div>
                    <p className="text-sm font-medium">Discover venues</p>
                    <p className="text-xs" style={{ color: "var(--brand-charcoal-soft)" }}>
                      Browse local spots actively looking for food trucks.
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <span className="text-lg">📥</span>
                  <div>
                    <p className="text-sm font-medium">Accept booking requests</p>
                    <p className="text-xs" style={{ color: "var(--brand-charcoal-soft)" }}>
                      Let venues book you directly through your public page.
                    </p>
                  </div>
                </div>
                <Link href="/pricing"
                  className="block text-center rounded-lg py-2 text-sm font-medium text-white mt-2"
                  style={{ background: "var(--brand-green)" }}>
                  Upgrade to Pro
                </Link>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Profile completion */}
      {!isProfileComplete && (
        <div className="rounded-xl border p-4" style={{ borderColor: "var(--brand-line)" }}>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold">Complete your profile</h2>
            <Link href="/dashboard/settings" className="text-xs underline"
              style={{ color: "var(--brand-green-dark)" }}>
              Go to settings
            </Link>
          </div>
          <div className="flex items-center gap-3 mb-3">
            <div className="flex-1 h-2 rounded-full" style={{ background: "var(--brand-line)" }}>
              <div className="h-2 rounded-full transition-all"
                style={{ width: `${profilePercent}%`, background: "var(--brand-green)" }} />
            </div>
            <span className="text-xs font-medium" style={{ color: "var(--brand-charcoal-soft)" }}>
              {profilePercent}%
            </span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {[
              { label: "Description", done: !!vendor.description },
              { label: "Phone number", done: !!vendor.contact_phone },
              { label: "Logo", done: !!vendor.logo_url },
              { label: "Social link", done: !!(vendor.instagram_url || vendor.facebook_url || vendor.tiktok_url) },
            ].map(item => (
              <div key={item.label} className="flex items-center gap-1.5">
                <span style={{ color: item.done ? "var(--brand-green)" : "var(--brand-line)", fontSize: "14px" }}>
                  {item.done ? "✓" : "○"}
                </span>
                <span className="text-xs" style={{ color: item.done ? "var(--brand-charcoal-soft)" : "var(--brand-charcoal)" }}>
                  {item.label}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Public page link */}
      <div className="rounded-xl border p-4" style={{ borderColor: "var(--brand-line)", background: "#fafaf8" }}>
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-sm font-medium">Your public page</p>
            <p className="text-xs mt-0.5" style={{ color: "var(--brand-charcoal-soft)" }}>
              Share this link on Instagram, Facebook, TikTok, and Google.
            </p>
          </div>
          <a
            href={`/t/${vendor.slug}`}
            target="_blank"
            rel="noopener noreferrer"
            className="shrink-0 rounded-lg px-3 py-1.5 text-xs font-medium border"
            style={{ borderColor: "var(--brand-green)", color: "var(--brand-green-dark)" }}>
            View page ↗
          </a>
        </div>
        <div className="mt-3 rounded-lg px-3 py-2 text-xs font-mono"
          style={{ background: "var(--brand-green-light)", color: "var(--brand-green-dark)" }}>
          vendorbeacon.app/t/{vendor.slug}
        </div>
      </div>
    </div>
  );
}
