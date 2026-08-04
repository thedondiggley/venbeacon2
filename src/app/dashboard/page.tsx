import { getCurrentVendor } from "@/lib/vendor";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { FeedbackForm } from "@/components/feedback-form";
import { StatCard, Card, Badge, ProgressBar, AlertBanner, PageHeader } from "@/components/ui";

export default async function DashboardHome() {
  const vendor = await getCurrentVendor();
  const supabase = await createClient();

  const { data: locations } = await supabase
    .from("locations").select("id, title, start_time, end_time, address")
    .eq("vendor_id", vendor.id).gte("start_time", new Date().toISOString())
    .order("start_time", { ascending: true }).limit(3);

  let pendingCount = 0;
  let recentBookings: { id: string; venue_name: string; event_date: string }[] = [];
  if (vendor.is_pro) {
    const { count } = await supabase.from("bookings")
      .select("id", { count: "exact", head: true })
      .eq("vendor_id", vendor.id).eq("status", "pending");
    pendingCount = count ?? 0;
    const { data: recent } = await supabase.from("bookings")
      .select("id, venue_name, event_date")
      .eq("vendor_id", vendor.id).eq("status", "pending")
      .order("created_at", { ascending: false }).limit(3);
    recentBookings = recent ?? [];
  }

  const profileFields = [vendor.description, vendor.contact_phone, vendor.logo_url, vendor.instagram_url || vendor.facebook_url || vendor.tiktok_url];
  const profilePercent = Math.round((profileFields.filter(Boolean).length / profileFields.length) * 100);

  function fmt(d: string) { return new Date(d + "T12:00:00").toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" }); }
  function fmtT(t: string) { return new Date(t).toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" }); }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }} className="animate-fade-in">

      {/* Pending booking alert */}
      {vendor.is_pro && pendingCount > 0 && (
        <AlertBanner
          type="success"
          title={`${pendingCount} booking request${pendingCount > 1 ? "s" : ""} waiting`}
          description="Venues are waiting to hear back from you. Respond within 48 hours."
          action={{ label: "Review now →", onClick: () => {} }}
        />
      )}

      {/* Public page hero */}
      <div style={{ background: "var(--green)", borderRadius: "var(--r-xl)", padding: "24px" }}>
        <p style={{ fontSize: 11, fontWeight: 800, color: "var(--green-dark)", letterSpacing: ".08em", marginBottom: 6 }}>YOUR PUBLIC PAGE IS LIVE</p>
        <p style={{ fontSize: 16, fontWeight: 700, color: "var(--green-dark)", marginBottom: 14 }}>Share this link everywhere 👇</p>
        <div style={{ background: "#fff", borderRadius: "var(--r-md)", padding: "12px 16px", fontFamily: "monospace", fontSize: 13, color: "var(--green-dark)", marginBottom: 12, wordBreak: "break-all" }}>
          vendorbeacon.app/t/{vendor.slug}
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <a href={`/t/${vendor.slug}`} target="_blank" rel="noopener noreferrer"
            style={{ background: "#fff", color: "var(--green-dark)", fontSize: 13, fontWeight: 700, padding: "8px 18px", borderRadius: 9999, textDecoration: "none" }}>
            View page ↗
          </a>
          <button onClick={() => navigator.clipboard.writeText(`https://vendorbeacon.app/t/${vendor.slug}`)}
            style={{ background: "rgba(10,42,10,0.15)", color: "var(--green-dark)", fontSize: 13, fontWeight: 700, padding: "8px 18px", borderRadius: 9999, border: "none", cursor: "pointer" }}>
            Copy link
          </button>
        </div>
      </div>

      {/* Stats row */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 12 }}>
        <StatCard label="Upcoming stops" value={locations?.length ?? 0} sub="Manage schedule" variant="default" action={{ label: "Manage", href: "/dashboard/schedule" }} />
        {vendor.is_pro ? (
          <StatCard label="Pending bookings" value={pendingCount} sub={pendingCount > 0 ? "Review now" : "View bookings"} variant={pendingCount > 0 ? "dark" : "default"} action={{ label: "Review", href: "/dashboard/bookings" }} />
        ) : (
          <div style={{ background: "var(--dark-2)", borderRadius: "var(--r-lg)", padding: "16px 18px" }}>
            <p style={{ fontSize: 11, fontWeight: 700, color: "var(--text-on-dark-3)", textTransform: "uppercase", letterSpacing: ".06em", marginBottom: 6 }}>Plan</p>
            <p style={{ fontSize: 24, fontWeight: 700, color: "#fff", marginBottom: 10 }}>Free</p>
            <Link href="/pricing" style={{ display: "block", background: "var(--green)", color: "var(--green-dark)", fontSize: 12, fontWeight: 700, padding: "7px 0", borderRadius: 9999, textDecoration: "none", textAlign: "center" }}>
              Upgrade to Pro
            </Link>
          </div>
        )}
      </div>

      {/* Pending bookings list */}
      {vendor.is_pro && pendingCount > 0 && (
        <Card variant="dark" padding="md">
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
            <p style={{ fontSize: 15, fontWeight: 700, color: "#fff" }}>Booking requests</p>
            <Link href="/dashboard/bookings" style={{ fontSize: 13, fontWeight: 700, color: "var(--green)", textDecoration: "none" }}>View all →</Link>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {recentBookings.map(b => (
              <Link key={b.id} href="/dashboard/bookings" style={{
                display: "flex", alignItems: "center", justifyContent: "space-between",
                padding: "12px 14px", background: "var(--dark-3)", borderRadius: "var(--r-md)",
                textDecoration: "none",
              }}>
                <div>
                  <p style={{ fontSize: 14, fontWeight: 600, color: "#fff", marginBottom: 2 }}>{b.venue_name}</p>
                  <p style={{ fontSize: 12, color: "var(--text-on-dark-3)" }}>{fmt(b.event_date)}</p>
                </div>
                <Badge variant="green">Pending</Badge>
              </Link>
            ))}
          </div>
        </Card>
      )}

      {/* Upcoming stops */}
      <Card padding="md">
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
          <p style={{ fontSize: 15, fontWeight: 700, color: "var(--text)" }}>Upcoming stops</p>
          <Link href="/dashboard/schedule" style={{ fontSize: 13, fontWeight: 700, color: "var(--green-mid)", textDecoration: "none" }}>Manage →</Link>
        </div>
        {!locations || locations.length === 0 ? (
          <div style={{ textAlign: "center", padding: "32px 0" }}>
            <p style={{ fontSize: 32, marginBottom: 10 }}>📍</p>
            <p style={{ fontSize: 15, fontWeight: 700, color: "var(--text)", marginBottom: 6 }}>No upcoming stops</p>
            <p style={{ fontSize: 13, color: "var(--text-3)", marginBottom: 16 }}>Add your schedule so customers always know where to find you</p>
            <Link href="/dashboard/schedule" style={{ display: "inline-block", background: "var(--green)", color: "var(--green-dark)", fontSize: 13, fontWeight: 700, padding: "9px 20px", borderRadius: 9999, textDecoration: "none" }}>
              Add your first stop
            </Link>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {locations.map((loc, i) => (
              <div key={loc.id} style={{
                display: "flex", alignItems: "center", gap: 12, padding: "12px 14px",
                background: i === 0 ? "var(--green-light)" : "var(--bg)",
                borderRadius: "var(--r-md)",
                border: `1px solid ${i === 0 ? "var(--green-border)" : "var(--border)"}`,
              }}>
                <div style={{ width: 10, height: 10, borderRadius: "50%", background: i === 0 ? "var(--green)" : "var(--border-2)", flexShrink: 0 }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: 14, fontWeight: 600, color: "var(--text)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{loc.title}</p>
                  <p style={{ fontSize: 12, color: "var(--text-3)", marginTop: 2 }}>{fmt(loc.start_time)} · {fmtT(loc.start_time)} – {fmtT(loc.end_time)}</p>
                </div>
                {i === 0 && <Badge variant="green">Next up</Badge>}
              </div>
            ))}
            <Link href="/dashboard/schedule" style={{ display: "block", textAlign: "center", fontSize: 13, fontWeight: 600, color: "var(--green-mid)", padding: "10px", textDecoration: "none", marginTop: 4 }}>
              View full schedule →
            </Link>
          </div>
        )}
      </Card>

      {/* Upgrade banner — free only */}
      {!vendor.is_pro && (
        <Card variant="dark" padding="md">
          <div style={{ display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
            <div style={{ flex: 1, minWidth: 200 }}>
              <p style={{ fontSize: 15, fontWeight: 700, color: "#fff", marginBottom: 4 }}>Unlock the venue board</p>
              <p style={{ fontSize: 13, color: "var(--text-on-dark-3)", lineHeight: 1.5 }}>Browse local breweries, apartments, and event spaces looking for food trucks. Accept booking requests directly — no cold calls.</p>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8, flexShrink: 0 }}>
              <Link href="/pricing" style={{ background: "var(--green)", color: "var(--green-dark)", fontSize: 13, fontWeight: 700, padding: "10px 20px", borderRadius: 9999, textDecoration: "none", whiteSpace: "nowrap", textAlign: "center" }}>
                Upgrade to Pro — $14.99/mo
              </Link>
              <Link href="/pricing" style={{ fontSize: 12, color: "var(--text-on-dark-3)", textDecoration: "none", textAlign: "center" }}>
                Or get a year for $99 →
              </Link>
            </div>
          </div>
        </Card>
      )}

      {/* Profile completion */}
      {profilePercent < 100 && (
        <Card padding="md">
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
            <p style={{ fontSize: 15, fontWeight: 700, color: "var(--text)" }}>Complete your profile</p>
            <Link href="/dashboard/settings" style={{ fontSize: 13, fontWeight: 700, color: "var(--green-mid)", textDecoration: "none" }}>Settings →</Link>
          </div>
          <ProgressBar value={profilePercent} showValue />
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginTop: 14 }}>
            {[
              { label: "Description", done: !!vendor.description },
              { label: "Phone number", done: !!vendor.contact_phone },
              { label: "Logo", done: !!vendor.logo_url },
              { label: "Social link", done: !!(vendor.instagram_url || vendor.facebook_url || vendor.tiktok_url) },
            ].map(item => (
              <div key={item.label} style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 12px", borderRadius: "var(--r-md)", background: item.done ? "var(--green-light)" : "var(--bg)", border: `1px solid ${item.done ? "var(--green-border)" : "var(--border)"}` }}>
                <span style={{ fontSize: 14, color: item.done ? "var(--green-mid)" : "var(--border-2)", fontWeight: 700 }}>{item.done ? "✓" : "○"}</span>
                <span style={{ fontSize: 13, fontWeight: 600, color: item.done ? "var(--green-dark)" : "var(--text-3)" }}>{item.label}</span>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Referral */}
      <Card padding="md">
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
          <div>
            <p style={{ fontSize: 15, fontWeight: 700, color: "var(--text)", marginBottom: 4 }}>🔗 Refer other food trucks</p>
            <p style={{ fontSize: 13, color: "var(--text-3)" }}>Earn a free month of Pro for every operator you refer who upgrades.</p>
          </div>
          <Link href="/dashboard/settings" style={{ background: "var(--green)", color: "var(--green-dark)", fontSize: 13, fontWeight: 700, padding: "9px 18px", borderRadius: 9999, textDecoration: "none", whiteSpace: "nowrap", flexShrink: 0 }}>
            Get your link
          </Link>
        </div>
      </Card>

      {/* Feedback */}
      <Card padding="md">
        <p style={{ fontSize: 15, fontWeight: 700, color: "var(--text)", marginBottom: 4 }}>Got feedback?</p>
        <p style={{ fontSize: 13, color: "var(--text-3)", marginBottom: 16 }}>Found a bug, have a feature idea, or just want to say something? We read everything and use it to shape what we build next.</p>
        <FeedbackForm vendorId={vendor.id} vendorName={vendor.business_name} vendorEmail={vendor.contact_email} />
      </Card>

    </div>
  );
}
