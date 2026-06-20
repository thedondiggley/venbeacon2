import { Logo } from "@/components/logo";
export default function PrivacyPage() {
  const email = "support@vendorbeacon.app";
  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-2xl mx-auto px-4 py-10 pb-20">
        <div className="mb-8"><a href="/"><Logo variant="full" size={30} /></a></div>
        <h1 className="text-2xl font-bold mb-2">Privacy Policy</h1>
        <p className="text-sm mb-8" style={{ color: "var(--brand-charcoal-soft)" }}>Effective date: June 18, 2026</p>
        <div className="space-y-6" style={{ color: "var(--brand-charcoal)" }}>
          {[
            ["Information We Collect","When you create a vendor account we collect your name, email address, phone number, and business information you provide (business name, description, food type, service areas, logo, social links). When you use the platform we collect schedule entries, booking requests, and basic usage analytics. Venue submitters provide venue name, address, contact info, and venue details. Payment information is processed entirely by Stripe and never stored on our servers."],
            ["How We Use Your Information","We use your information to operate the VendorBeacon platform, send transactional emails (welcome, booking notifications, billing receipts, password resets), display your public page and venue listings, and improve the service. We do not sell your personal information to third parties."],
            ["Public Information","Your public vendor page (business name, description, schedule, social links, logo) is visible to anyone with your page link. Venue listings (name, address, type, availability, amenities) are visible to all Pro vendors on the platform. Contact information for venues is only revealed to Pro vendors who explicitly tap to reveal it."],
            ["Third-Party Services","We use Supabase (database and authentication), Stripe (payment processing), Resend (transactional email), Cloudinary (image storage), and Vercel (hosting). Each service has its own privacy policy governing how they handle data passed to them."],
            ["Data Retention","We retain your data as long as your account is active. When you delete your account, your personal data is removed within 30 days. Some data may be retained longer where required for legal, billing, or fraud-prevention purposes."],
            ["Your Rights","You may access, update, or delete your account data at any time through your account Settings. To request a full data export or have your data deleted outside of self-service tools, email us."],
            ["Cookies","We use essential session cookies to keep you logged in. We do not use advertising or third-party tracking cookies."],
            ["Children's Privacy","VendorBeacon is not directed at individuals under 18. We do not knowingly collect data from minors."],
            ["Data Security","We use industry-standard security practices including encrypted connections, row-level database security, and restricted API access. No method of transmission over the internet is 100% secure, and we cannot guarantee absolute security."],
            ["Changes to This Policy","We may update this policy periodically. Material changes will be communicated via email or in-app notice."],
            ["Contact",`Privacy questions: ${email}`],
          ].map(([title, body]) => (
            <section key={title}>
              <h2 className="text-base font-semibold mb-2">{title}</h2>
              <p className="text-sm leading-relaxed" style={{ color: "var(--brand-charcoal-soft)" }}>{body}</p>
            </section>
          ))}
        </div>
        <div className="mt-10 pt-6 border-t flex gap-4 flex-wrap text-sm" style={{ borderColor: "var(--brand-line)" }}>
          <a href="/terms" className="underline" style={{ color: "var(--brand-charcoal-soft)" }}>Terms of Service</a>
          <a href="/refund" className="underline" style={{ color: "var(--brand-charcoal-soft)" }}>Refund Policy</a>
          <a href="/guidelines" className="underline" style={{ color: "var(--brand-charcoal-soft)" }}>Community Guidelines</a>
          <a href="/contact" className="underline" style={{ color: "var(--brand-charcoal-soft)" }}>Contact</a>
        </div>
      </div>
    </div>
  );
}
