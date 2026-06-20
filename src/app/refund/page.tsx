import { Logo } from "@/components/logo";
export default function RefundPage() {
  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-2xl mx-auto px-4 py-10 pb-20">
        <div className="mb-8"><a href="/"><Logo variant="full" size={30} /></a></div>
        <h1 className="text-2xl font-bold mb-2">Refund Policy</h1>
        <p className="text-sm mb-8" style={{ color: "var(--brand-charcoal-soft)" }}>Effective date: June 18, 2026</p>
        <div className="space-y-6" style={{ color: "var(--brand-charcoal)" }}>
          <section><h2 className="text-base font-semibold mb-2">Subscription Refunds</h2>
            <p className="text-sm leading-relaxed" style={{ color: "var(--brand-charcoal-soft)" }}>
              VendorBeacon offers Pro Monthly and Pro Annual subscription plans. If you are unsatisfied with your subscription, you may request a refund within 7 days of your initial charge or renewal by contacting us at support@vendorbeacon.app. Refunds are issued at our discretion and are not guaranteed for partial billing periods.
            </p></section>
          <section><h2 className="text-base font-semibold mb-2">Cancellations</h2>
            <p className="text-sm leading-relaxed" style={{ color: "var(--brand-charcoal-soft)" }}>
              You may cancel your subscription at any time from your account Settings. Upon cancellation, you retain Pro access until the end of your current billing period. No prorated refunds are issued for the remaining period after cancellation.
            </p></section>
          <section><h2 className="text-base font-semibold mb-2">Venue Listings</h2>
            <p className="text-sm leading-relaxed" style={{ color: "var(--brand-charcoal-soft)" }}>
              Venue listings are currently free. There are no charges associated with listing a venue on VendorBeacon.
            </p></section>
          <section><h2 className="text-base font-semibold mb-2">Vendor/Venue Agreements</h2>
            <p className="text-sm leading-relaxed" style={{ color: "var(--brand-charcoal-soft)" }}>
              VendorBeacon is a discovery and connection platform. We are not party to any agreements, payments, or arrangements made between vendors and venues. Any disputes regarding fees, deposits, or services between vendors and venues must be resolved between those parties directly.
            </p></section>
          <section><h2 className="text-base font-semibold mb-2">Contact</h2>
            <p className="text-sm" style={{ color: "var(--brand-charcoal-soft)" }}>
              Refund requests: <a href="mailto:support@vendorbeacon.app" style={{ color: "var(--brand-green-dark)" }}>support@vendorbeacon.app</a>
            </p></section>
        </div>
      </div>
    </div>
  );
}
