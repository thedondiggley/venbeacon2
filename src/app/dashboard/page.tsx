import { getCurrentVendor } from "@/lib/vendor";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { FeedbackForm } from "@/components/feedback-form";

export default async function DashboardHome() {
  const vendor = await getCurrentVendor();
  const supabase = await createClient();

  const { data: locations } = await supabase
    .from("locations")
    .select("id, title, start_time, end_time, address")
    .eq("vendor_id", vendor.id)
    .gte("start_time", new Date().toISOString())
    .order("start_time", { ascending: true })
    .limit(3);

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

  const profileFields = [
    vendor.description,
    vendor.contact_phone,
    vendor.logo_url,
    vendor.instagram_url || vendor.facebook_url || vendor.tiktok_url,
  ];
  const completedFields = profileFields.filter(Boolean).length;
  const profilePercent = Math.round((completedFields / profileFields.length) * 100);

  function formatDate(d: string) {
    return new Date(d + "T12:00:00").toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" });
  }
  function formatTime(t: string) {
    return new Date(t).toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
  }

  return (
    <div className="space-y-4">

      {/* Welcome + stats row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Public page card */}
        <div className="sm:col-span-2 rounded-2xl p-5" style={{ background: "var(--brand-green)" }}>
          <div className="text-xs font-semibold mb-1" style={{ color: "var(--brand-green-dark)" }}>
            YOUR PUBLIC PAGE IS LIVE
          </div>
          <div className="text-base font-semibold mb-3" style={{ color: "var(--brand-green-darker)" }}>
            Share this link everywhere 👇
          </div>
          <div className="rounded-xl px-4 py-3 font-mono text-sm mb-3" style={{ background: "var(--brand-green-darker)", color: "var(--brand-green)" }}>
            vendorbeacon.app/t/{vendor.slug}
          </div>
          <div className="flex gap-2">
            <a href={`/t/${vendor.slug}`} target="_blank" rel="noopener noreferrer"
              className="text-xs font-semibold px-4 py-2 rounded-lg"
              style={{ background: "var(--brand-green-darker)", color: "var(--brand-green)" }}>
              View page ↗
            </a>
          </div>
        </div>

        {/* Stats */}
        <div className="flex flex-col gap-3">
          <div className="rounded-2xl p-4 flex-1" style={{ background: "#fff", border: "0.5px solid var(--brand-line)" }}>
            <div className="text-xs mb-1" style={{ color: "var(--brand-charcoal-soft)" }}>Upcoming stops</div>
            <div className="text-3xl font-semibold" style={{ color: "var(--brand-charcoal)" }}>{locations?.length ?? 0}</div>
            <Link href="/dashboard/schedule" className="text-xs font-medium mt-1 block" style={{ color: "var(--brand-green-mid)" }}>
              Manage schedule →
            </Link>
          </div>
          {vendor.is_pro ? (
            <div className="rounded-2xl p-4 flex-1" style={{ background: pendingCount > 0 ? "#1A1A1A" : "#fff", border: `0.5px solid ${pendingCount > 0 ? "var(--brand-green)" : "var(--brand-line)"}` }}>
              <div className="text-xs mb-1" style={{ color: pendingCount > 0 ? "#888" : "var(--brand-charcoal-soft)" }}>Pending bookings</div>
              <div className="text-3xl font-semibold" style={{ color: pendingCount > 0 ? "var(--brand-green)" : "var(--brand-charcoal)" }}>{pendingCount}</div>
              <Link href="/dashboard/bookings" className="text-xs font-medium mt-1 block" style={{ color: pendingCount > 0 ? "var(--brand-green)" : "var(--brand-green-mid)" }}>
                {pendingCount > 0 ? "Review now →" : "View bookings →"}
              </Link>
            </div>
          ) : (
            <div className="rounded-2xl p-4 flex-1" style={{ background: "#1A1A1A" }}>
              <div className="text-xs mb-1" style={{ color: "#888" }}>Plan</div>
              <div className="text-base font-semibold" style={{ color: "#fff" }}>Free</div>
              <Link href="/pricing" className="text-xs font-semibold mt-2 block px-3 py-1.5 rounded-lg text-center" style={{ background: "var(--brand-green)", color: "var(--brand-green-darker)" }}>
                Upgrade to Pro
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Pending bookings alert */}
      {vendor.is_pro && pendingCount > 0 && (
        <div className="rounded-2xl p-5" style={{ background: "#1A1A1A" }}>
          <div className="flex items-center justify-between mb-3">
            <div>
              <div className="text-sm font-semibold" style={{ color: "#fff" }}>
                {pendingCount} booking {pendingCount === 1 ? "request" : "requests"} waiting
              </div>
              <div className="text-xs mt-0.5" style={{ color: "#888" }}>Venues are waiting to hear back from you</div>
            </div>
            <Link href="/dashboard/bookings"
              className="text-xs font-semibold px-4 py-2 rounded-lg"
              style={{ background: "var(--brand-green)", color: "var(--brand-green-darker)" }}>
              Review now
            </Link>
          </div>
          <div className="space-y-2">
            {recentBookings.map(b => (
              <Link key={b.id} href="/dashboard/bookings"
                className="flex items-center justify-between rounded-xl px-4 py-3"
                style={{ background: "#242424" }}>
                <div>
                  <div className="text-sm font-medium" style={{ color: "#fff" }}>{b.venue_name}</div>
                  <div className="text-xs mt-0.5" style={{ color: "#888" }}>{formatDate(b.event_date)}</div>
                </div>
                <span className="text-xs px-2 py-1 rounded-full font-semibold"
                  style={{ background: "var(--brand-green)", color: "var(--brand-green-darker)" }}>
                  Pending
                </span>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Upcoming stops */}
      <div className="rounded-2xl p-5" style={{ background: "#fff", border: "0.5px solid var(--brand-line)" }}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold" style={{ color: "var(--brand-charcoal)" }}>Upcoming stops</h2>
          <Link href="/dashboard/schedule" className="text-xs font-medium" style={{ color: "var(--brand-green-mid)" }}>
            Manage →
          </Link>
        </div>
        {!locations || locations.length === 0 ? (
          <div className="text-center py-6">
            <div className="text-2xl mb-2">📍</div>
            <p className="text-sm font-medium mb-1" style={{ color: "var(--brand-charcoal)" }}>No upcoming stops</p>
            <p className="text-xs mb-4" style={{ color: "var(--brand-charcoal-soft)" }}>Add your schedule so customers know where to find you</p>
            <Link href="/dashboard/schedule"
              className="inline-block text-xs font-semibold px-4 py-2 rounded-lg"
              style={{ background: "var(--brand-green)", color: "var(--brand-green-darker)" }}>
              Add your first stop →
            </Link>
          </div>
        ) : (
          <div className="space-y-2">
            {locations.map((loc, i) => (
              <div key={loc.id} className="flex items-center gap-3 rounded-xl p-3"
                style={{ background: i === 0 ? "var(--brand-green-light)" : "var(--brand-surface)", border: `0.5px solid ${i === 0 ? "var(--brand-green)" : "var(--brand-line)"}` }}>
                <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: i === 0 ? "var(--brand-green)" : "var(--brand-line)" }} />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate" style={{ color: "var(--brand-charcoal)" }}>{loc.title}</div>
                  <div className="text-xs mt-0.5" style={{ color: "var(--brand-charcoal-soft)" }}>
                    {formatDate(loc.start_time)} · {formatTime(loc.start_time)} – {formatTime(loc.end_time)}
                  </div>
                </div>
                {i === 0 && <span className="text-xs px-2 py-0.5 rounded-full font-semibold" style={{ background: "var(--brand-green)", color: "var(--brand-green-darker)" }}>Next up</span>}
              </div>
            ))}
            <Link href="/dashboard/schedule"
              className="block text-center text-xs font-medium mt-2 py-2 rounded-xl"
              style={{ background: "var(--brand-surface)", color: "var(--brand-green-mid)", border: "0.5px solid var(--brand-line)" }}>
              View full schedule →
            </Link>
          </div>
        )}
      </div>

      {/* Pro upgrade banner — free vendors only */}
      {!vendor.is_pro && (
        <div className="rounded-2xl p-5" style={{ background: "#1A1A1A" }}>
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <div className="text-sm font-semibold mb-1" style={{ color: "#fff" }}>Unlock the venue board</div>
              <div className="text-xs mb-3" style={{ color: "#888" }}>Browse local breweries, apartment communities, and event spaces actively looking for food trucks. Accept booking requests directly.</div>
              <div className="flex gap-2 flex-wrap">
                <Link href="/pricing"
                  className="text-xs font-semibold px-4 py-2 rounded-lg"
                  style={{ background: "var(--brand-green)", color: "var(--brand-green-darker)" }}>
                  Upgrade to Pro — $14.99/mo
                </Link>
                <Link href="/pricing"
                  className="text-xs font-medium px-4 py-2 rounded-lg"
                  style={{ background: "#2A2A2A", color: "#888" }}>
                  View all plans
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Profile completion */}
      {profilePercent < 100 && (
        <div className="rounded-2xl p-5" style={{ background: "#fff", border: "0.5px solid var(--brand-line)" }}>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold" style={{ color: "var(--brand-charcoal)" }}>Complete your profile</h2>
            <Link href="/dashboard/settings" className="text-xs font-medium" style={{ color: "var(--brand-green-mid)" }}>
              Go to settings →
            </Link>
          </div>
          <div className="flex items-center gap-3 mb-4">
            <div className="flex-1 h-2 rounded-full" style={{ background: "var(--brand-line)" }}>
              <div className="h-2 rounded-full transition-all" style={{ width: `${profilePercent}%`, background: "var(--brand-green)" }} />
            </div>
            <span className="text-xs font-semibold" style={{ color: "var(--brand-charcoal-soft)" }}>{profilePercent}%</span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {[
              { label: "Description", done: !!vendor.description },
              { label: "Phone number", done: !!vendor.contact_phone },
              { label: "Logo", done: !!vendor.logo_url },
              { label: "Social link", done: !!(vendor.instagram_url || vendor.facebook_url || vendor.tiktok_url) },
            ].map(item => (
              <div key={item.label} className="flex items-center gap-2 rounded-lg px-3 py-2"
                style={{ background: item.done ? "var(--brand-green-light)" : "var(--brand-surface)", border: `0.5px solid ${item.done ? "var(--brand-green)" : "var(--brand-line)"}` }}>
                <span style={{ color: item.done ? "var(--brand-green-mid)" : "var(--brand-line)", fontSize: 14, fontWeight: 700 }}>
                  {item.done ? "✓" : "○"}
                </span>
                <span className="text-xs" style={{ color: item.done ? "var(--brand-green-dark)" : "var(--brand-charcoal-soft)" }}>
                  {item.label}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Referral */}
      <div className="rounded-2xl p-5" style={{ background: "var(--brand-surface)", border: "0.5px solid var(--brand-line)" }}>
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm font-semibold mb-1" style={{ color: "var(--brand-charcoal)" }}>🔗 Refer other food trucks</div>
            <div className="text-xs" style={{ color: "var(--brand-charcoal-soft)" }}>Earn a free month of Pro every time someone you refer upgrades.</div>
          </div>
          <Link href="/dashboard/settings"
            className="text-xs font-semibold px-3 py-2 rounded-lg whitespace-nowrap"
            style={{ background: "var(--brand-green)", color: "var(--brand-green-darker)" }}>
            Get your link
          </Link>
        </div>
      </div>

      {/* Feedback */}
      <div className="rounded-2xl p-5" style={{ background: "#fff", border: "0.5px solid var(--brand-line)" }}>
        <h2 className="text-sm font-semibold mb-1" style={{ color: "var(--brand-charcoal)" }}>Got feedback?</h2>
        <p className="text-xs mb-4" style={{ color: "var(--brand-charcoal-soft)" }}>
          Found a bug, have an idea, or just want to tell us something? We read everything.
        </p>
        <FeedbackForm vendorId={vendor.id} vendorName={vendor.business_name} vendorEmail={vendor.contact_email} />
      </div>

    </div>
  );
}
