import { getCurrentVendor } from "@/lib/vendor";
import { redirect } from "next/navigation";
import { AdminAddVenueForm } from "./form";

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS ?? "").split(",").map(e => e.trim().toLowerCase());

export default async function AdminAddVenuePage() {
  const vendor = await getCurrentVendor();
  if (!ADMIN_EMAILS.includes(vendor.contact_email?.toLowerCase() ?? "")) {
    redirect("/dashboard");
  }
  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <a href="/admin" className="text-sm underline" style={{ color: "var(--brand-green-dark)" }}>← Admin</a>
          <span style={{ color: "var(--brand-charcoal-soft)" }}>/</span>
          <h1 className="text-lg font-semibold">Add venue listing</h1>
        </div>
        <div className="bg-white rounded-xl border p-6" style={{ borderColor: "var(--brand-line)" }}>
          <p className="text-sm mb-6" style={{ color: "var(--brand-charcoal-soft)" }}>
            Use this form to add venue listings directly — public spaces, parks, street spots, or any venue you're seeding the board with. These skip email verification and go live as soon as you approve them in the admin dashboard.
          </p>
          <AdminAddVenueForm />
        </div>
      </div>
    </div>
  );
}
