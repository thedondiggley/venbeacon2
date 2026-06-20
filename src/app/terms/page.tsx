import { Logo } from "@/components/logo";
export default function TermsPage() {
  const email = "support@vendorbeacon.app";
  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-2xl mx-auto px-4 py-10 pb-20">
        <div className="mb-8"><a href="/"><Logo variant="full" size={30} /></a></div>
        <h1 className="text-2xl font-bold mb-2">Terms of Service</h1>
        <p className="text-sm mb-8" style={{ color: "var(--brand-charcoal-soft)" }}>Effective date: June 18, 2026</p>
        <div className="space-y-6" style={{ color: "var(--brand-charcoal)" }}>
          {[
            ["1. Acceptance","By creating an account or using VendorBeacon (vendorbeacon.app), you agree to these Terms of Service. If you do not agree, do not use the service. VendorBeacon is operated by Nexus Digital Studio, Rossville, Georgia."],
            ["2. Description of Service","VendorBeacon is a web-based discovery and connection platform that helps mobile food vendors manage their public schedule, discover venues, and receive booking requests. Venues may list their space for free. Vendors may access premium features through a paid Pro subscription. VendorBeacon does not guarantee that connections between vendors and venues will result in successful events or arrangements."],
            ["3. User Accounts","You must provide accurate information when creating an account. You are responsible for maintaining the security of your account credentials. You must be at least 18 years old to create an account. We reserve the right to terminate accounts that violate these terms without notice."],
            ["4. Venue Listings","Venue listings are submitted by third parties without account creation. By submitting a listing, you represent that you have the authority to list the venue and that all information provided is accurate. VendorBeacon reserves the right to remove any listing that violates these terms or community guidelines at any time."],
            ["5. Subscriptions and Payments","Pro subscriptions are billed monthly or annually via Stripe. Subscriptions automatically renew until canceled. You may cancel at any time through your account Settings. Refunds are handled per our Refund Policy. Prices may change with 30 days notice to active subscribers."],
            ["6. Platform Role and Disclaimer","VendorBeacon is a discovery and connection platform only. We are not a party to any agreements, arrangements, transactions, or disputes between vendors and venues. We do not endorse, verify, or guarantee any vendor or venue on the platform. You use the platform and engage with other parties entirely at your own risk."],
            ["7. Limitation of Liability","To the maximum extent permitted by law, VendorBeacon, its operators, and affiliates shall not be liable for any indirect, incidental, special, consequential, or punitive damages arising from your use of the service, including but not limited to losses arising from vendor/venue arrangements, failed events, or platform downtime."],
            ["8. User Content","You retain ownership of content you submit. By submitting content, you grant VendorBeacon a non-exclusive license to display it on the platform. You agree not to submit false, misleading, offensive, or illegal content. VendorBeacon may remove content that violates these terms."],
            ["9. Prohibited Conduct","You may not: submit false information, spam other users, scrape platform data, attempt unauthorized access, use the service for illegal purposes, or impersonate other users or businesses."],
            ["10. Termination","We may suspend or terminate your account at any time for violations of these terms. You may delete your account at any time from your account Settings. Upon termination, your access to the platform ends and your data is deleted per our Privacy Policy."],
            ["11. Governing Law","These terms are governed by the laws of the State of Georgia, without regard to conflict of law principles."],
            ["12. Changes","We may update these terms at any time. Continued use of the service after changes constitutes acceptance."],
            ["13. Contact",`Questions: ${email}`],
          ].map(([title, body]) => (
            <section key={title}>
              <h2 className="text-base font-semibold mb-2">{title}</h2>
              <p className="text-sm leading-relaxed" style={{ color: "var(--brand-charcoal-soft)" }}>{body}</p>
            </section>
          ))}
        </div>
        <div className="mt-10 pt-6 border-t flex gap-4 flex-wrap text-sm" style={{ borderColor: "var(--brand-line)" }}>
          <a href="/privacy" className="underline" style={{ color: "var(--brand-charcoal-soft)" }}>Privacy Policy</a>
          <a href="/refund" className="underline" style={{ color: "var(--brand-charcoal-soft)" }}>Refund Policy</a>
          <a href="/guidelines" className="underline" style={{ color: "var(--brand-charcoal-soft)" }}>Community Guidelines</a>
          <a href="/contact" className="underline" style={{ color: "var(--brand-charcoal-soft)" }}>Contact</a>
        </div>
      </div>
    </div>
  );
}
