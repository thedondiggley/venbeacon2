import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { Resend } from "resend";

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("token");
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://vendorbeacon.app";

  if (!token) return NextResponse.redirect(`${appUrl}/verify-result?status=invalid`);

  const supabase = createServiceClient();

  const { data: listing } = await supabase
    .from("venue_listings")
    .select("id, venue_name, slug, contact_email, edit_token, email_verified")
    .eq("verification_token", token)
    .single();

  if (!listing) return NextResponse.redirect(`${appUrl}/verify-result?status=invalid`);

  if (listing.email_verified) {
    return NextResponse.redirect(`${appUrl}/verify-result?status=already&slug=${listing.slug}`);
  }

  const { error } = await supabase
    .from("venue_listings")
    .update({ email_verified: true, is_published: true })
    .eq("id", listing.id);

  if (error) return NextResponse.redirect(`${appUrl}/verify-result?status=error`);

  // Send the "you're live" confirmation + edit link now that it's actually published
  if (process.env.RESEND_API_KEY && listing.contact_email) {
    try {
      const resend = new Resend(process.env.RESEND_API_KEY);
      const editUrl = `${appUrl}/venue/edit/${listing.edit_token}`;
      const venueUrl = `${appUrl}/venue/${listing.slug}`;

      await resend.emails.send({
        from: process.env.BOOKING_NOTIFICATION_FROM_EMAIL ?? "VendorBeacon <notifications@vendorbeacon.app>",
        to: listing.contact_email,
        subject: `You're live on VendorBeacon — ${listing.venue_name}`,
        html: `<!DOCTYPE html><html><head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background:#f0f0ee;font-family:-apple-system,sans-serif;">
<div style="max-width:520px;margin:40px auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,.08)">
  <div style="background:#639922;padding:28px 36px;text-align:center"><div style="font-size:22px;font-weight:800;color:#fff">VendorBeacon</div></div>
  <div style="padding:32px 36px">
    <h1 style="font-size:20px;font-weight:700;color:#2C2C2A;margin:0 0 8px">You're on the board! 🎉</h1>
    <p style="font-size:14px;color:#5F5E5A;margin:0 0 20px;line-height:1.6"><strong>${listing.venue_name}</strong> is now live on VendorBeacon's venue board. Food truck operators in your area can find you and reach out directly.</p>
    <div style="background:#EAF3DE;border-radius:10px;padding:18px;margin-bottom:20px;text-align:center">
      <div style="font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:.06em;color:#3B6D11;margin-bottom:8px">Your venue page</div>
      <a href="${venueUrl}" style="display:block;background:#639922;color:#fff;text-decoration:none;padding:10px 16px;border-radius:8px;font-size:13px;font-weight:600">${venueUrl}</a>
    </div>
    <div style="border:1px solid #D3D1C7;border-radius:10px;padding:18px">
      <div style="font-size:13px;font-weight:600;color:#2C2C2A;margin-bottom:6px">Need to make changes?</div>
      <p style="font-size:12px;color:#5F5E5A;margin:0 0 12px;line-height:1.5">Use your unique edit link to update or remove your listing. This link expires in 90 days — we'll email you a fresh one if needed.</p>
      <a href="${editUrl}" style="display:block;background:#2C2C2A;color:#fff;text-decoration:none;padding:10px 16px;border-radius:8px;font-size:13px;font-weight:600;text-align:center">Edit or remove my listing →</a>
    </div>
  </div>
  <div style="background:#f8f8f6;padding:16px 36px;text-align:center;border-top:1px solid #D3D1C7"><p style="font-size:11px;color:#5F5E5A;margin:0">VendorBeacon · <a href="${appUrl}" style="color:#639922">vendorbeacon.app</a></p></div>
</div></body></html>`,
      });

      const ownerEmail = process.env.OWNER_NOTIFICATION_EMAIL;
      if (ownerEmail) {
        await resend.emails.send({
          from: process.env.BOOKING_NOTIFICATION_FROM_EMAIL ?? "VendorBeacon <notifications@vendorbeacon.app>",
          to: ownerEmail,
          subject: `🏢 Venue verified & live — ${listing.venue_name}`,
          html: `<div style="font-family:-apple-system,sans-serif;max-width:480px;margin:0 auto;padding:24px"><p>${listing.venue_name} just verified their email and went live: <a href="${venueUrl}">${venueUrl}</a></p></div>`,
        }).catch(() => {});
      }
    } catch (err) {
      console.error("Post-verification email error:", err);
    }
  }

  return NextResponse.redirect(`${appUrl}/verify-result?status=success&slug=${listing.slug}`);
}
