import { Logo } from "@/components/logo";
export default function GuidelinesPage() {
  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-2xl mx-auto px-4 py-10 pb-20">
        <div className="mb-8"><a href="/"><Logo variant="full" size={30} /></a></div>
        <h1 className="text-2xl font-bold mb-2">Community Guidelines</h1>
        <p className="text-sm mb-8" style={{ color: "var(--brand-charcoal-soft)" }}>Standards for vendors and venues on VendorBeacon</p>
        <div className="space-y-6" style={{ color: "var(--brand-charcoal)" }}>
          <section><h2 className="text-base font-semibold mb-2">For Vendors</h2>
            <ul className="text-sm space-y-2" style={{ color: "var(--brand-charcoal-soft)" }}>
              <li>• Keep your schedule accurate and up to date. Outdated locations erode customer trust.</li>
              <li>• Use your real business name and accurate contact information.</li>
              <li>• Respond to booking requests in a timely manner — within 48 hours is expected.</li>
              <li>• Do not submit duplicate booking requests to the same venue for the same date.</li>
              <li>• Honor booking commitments you have approved. Repeated no-shows may result in account suspension.</li>
              <li>• Do not use VendorBeacon to harass, spam, or contact venues for purposes unrelated to food truck booking.</li>
              <li>• Upload only legitimate business logos and photos you have the right to use.</li>
            </ul></section>
          <section><h2 className="text-base font-semibold mb-2">For Venues</h2>
            <ul className="text-sm space-y-2" style={{ color: "var(--brand-charcoal-soft)" }}>
              <li>• Provide accurate and complete information about your venue, availability, and requirements.</li>
              <li>• Do not list venues you do not own or have authority to list.</li>
              <li>• Keep your listing updated — if availability changes, update or remove your listing promptly.</li>
              <li>• Do not list venues primarily to collect vendor contact information for unrelated purposes.</li>
              <li>• Communicate clearly with vendors who reach out about their interest.</li>
            </ul></section>
          <section><h2 className="text-base font-semibold mb-2">Prohibited Content</h2>
            <ul className="text-sm space-y-2" style={{ color: "var(--brand-charcoal-soft)" }}>
              <li>• False or misleading business information</li>
              <li>• Spam or duplicate listings</li>
              <li>• Offensive, discriminatory, or illegal content</li>
              <li>• Content that violates any third-party rights</li>
              <li>• Listings for businesses that do not exist or are not operational</li>
            </ul></section>
          <section><h2 className="text-base font-semibold mb-2">Enforcement</h2>
            <p className="text-sm" style={{ color: "var(--brand-charcoal-soft)" }}>
              Violations of these guidelines may result in listing removal, account suspension, or permanent ban from VendorBeacon. To report a listing or user, email <a href="mailto:support@vendorbeacon.app" style={{ color: "var(--brand-green-dark)" }}>support@vendorbeacon.app</a>.
            </p></section>
          <section><h2 className="text-base font-semibold mb-2">Disclaimer</h2>
            <p className="text-sm" style={{ color: "var(--brand-charcoal-soft)" }}>
              VendorBeacon is a discovery platform. We do not guarantee the quality, safety, reliability, or legality of any vendor or venue listed. All arrangements between vendors and venues are made at your own discretion and risk.
            </p></section>
        </div>
      </div>
    </div>
  );
}
