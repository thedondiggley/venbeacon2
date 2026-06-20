import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { Resend } from "resend";

export async function POST(req: NextRequest) {
  try {
    const { userId } = await req.json();
    if (!userId) return NextResponse.json({ error: "Missing userId" }, { status: 400 });

    const supabase = createServiceClient();

    const { data: vendor } = await supabase
      .from("vendors")
      .select("business_name, contact_email, slug")
      .eq("user_id", userId)
      .single();

    if (!vendor?.contact_email) {
      return NextResponse.json({ error: "Vendor not found" }, { status: 404 });
    }

    if (!process.env.RESEND_API_KEY) {
      return NextResponse.json({ ok: true, skipped: "no resend key" });
    }

    const resend = new Resend(process.env.RESEND_API_KEY);
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://vendorbeacon.app";
    const publicUrl = `${appUrl}/t/${vendor.slug}`;
    const dashboardUrl = `${appUrl}/dashboard`;

    // Send welcome email to new vendor
    await resend.emails.send({
      from: process.env.BOOKING_NOTIFICATION_FROM_EMAIL ?? "VendorBeacon <notifications@vendorbeacon.app>",
      to: vendor.contact_email,
      subject: "Welcome to VendorBeacon — your public page is live",
      html: `<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#f0f0ee;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
<div style="max-width:560px;margin:40px auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,.08)">
  <div style="background:#639922;padding:32px 40px;text-align:center">
    <div style="font-size:24px;font-weight:800;color:#fff">VendorBeacon</div>
  </div>
  <div style="padding:40px">
    <h1 style="font-size:22px;font-weight:700;color:#2C2C2A;margin:0 0 8px">Welcome, ${vendor.business_name}! 👋</h1>
    <p style="font-size:15px;color:#5F5E5A;margin:0 0 24px;line-height:1.6">Your account is live. Here's everything you need to get started.</p>
    <div style="background:#EAF3DE;border-radius:10px;padding:20px;margin-bottom:24px">
      <div style="font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:.06em;color:#3B6D11;margin-bottom:6px">Your public page is live</div>
      <div style="font-size:15px;font-weight:600;color:#2C2C2A;margin-bottom:12px">Share this link everywhere 👇</div>
      <a href="${publicUrl}" style="display:block;background:#639922;color:#fff;text-decoration:none;padding:12px 20px;border-radius:8px;font-size:14px;font-weight:600;text-align:center">${publicUrl}</a>
      <p style="font-size:12px;color:#3B6D11;margin:10px 0 0;text-align:center">Put this in your Instagram bio, Facebook page, TikTok bio, and Google Business Profile</p>
    </div>
    <div style="margin-bottom:28px">
      <div style="font-size:14px;font-weight:600;color:#2C2C2A;margin-bottom:14px">Get the most out of VendorBeacon:</div>
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr><td width="36" valign="top"><div style="background:#639922;color:#fff;border-radius:50%;width:24px;height:24px;font-size:12px;font-weight:700;text-align:center;line-height:24px">1</div></td><td style="padding-bottom:12px"><div style="font-size:13px;font-weight:600;color:#2C2C2A">Add your weekly schedule</div><div style="font-size:12px;color:#5F5E5A">Go to your dashboard and add where you'll be this week. It shows on your public page instantly.</div></td></tr>
        <tr><td width="36" valign="top"><div style="background:#639922;color:#fff;border-radius:50%;width:24px;height:24px;font-size:12px;font-weight:700;text-align:center;line-height:24px">2</div></td><td style="padding-bottom:12px"><div style="font-size:13px;font-weight:600;color:#2C2C2A">Complete your profile</div><div style="font-size:12px;color:#5F5E5A">Add your logo, description, phone number, and social links in Settings.</div></td></tr>
        <tr><td width="36" valign="top"><div style="background:#639922;color:#fff;border-radius:50%;width:24px;height:24px;font-size:12px;font-weight:700;text-align:center;line-height:24px">3</div></td><td style="padding-bottom:12px"><div style="font-size:13px;font-weight:600;color:#2C2C2A">Share your link everywhere</div><div style="font-size:12px;color:#5F5E5A">Instagram bio, Facebook page, TikTok bio, Google Business Profile — one link covers all of them.</div></td></tr>
        <tr><td width="36" valign="top"><div style="background:#EAF3DE;color:#639922;border-radius:50%;width:24px;height:24px;font-size:12px;font-weight:700;text-align:center;line-height:24px">4</div></td><td><div style="font-size:13px;font-weight:600;color:#2C2C2A">Upgrade to Pro to find new venues</div><div style="font-size:12px;color:#5F5E5A">Browse local breweries, apartments, and office parks looking for food trucks. Accept booking requests. From $25/month.</div></td></tr>
      </table>
    </div>
    <a href="${dashboardUrl}" style="display:block;background:#2C2C2A;color:#fff;text-decoration:none;padding:14px 20px;border-radius:10px;font-size:14px;font-weight:600;text-align:center;margin-bottom:24px">Go to your dashboard →</a>
    <p style="font-size:13px;color:#5F5E5A;line-height:1.6;margin:0">Questions? Reply to this email and we'll help you get set up.</p>
  </div>
  <div style="background:#f8f8f6;padding:20px 40px;text-align:center;border-top:1px solid #D3D1C7">
    <p style="font-size:12px;color:#5F5E5A;margin:0">VendorBeacon · <a href="${appUrl}" style="color:#639922;text-decoration:none">vendorbeacon.app</a></p>
  </div>
</div>
</body>
</html>`,
    });

    // Notify owner of new signup
    const ownerEmail = process.env.OWNER_NOTIFICATION_EMAIL;
    if (ownerEmail) {
      await resend.emails.send({
        from: process.env.BOOKING_NOTIFICATION_FROM_EMAIL ?? "VendorBeacon <notifications@vendorbeacon.app>",
        to: ownerEmail,
        subject: `🚚 New vendor signed up — ${vendor.business_name}`,
        html: `
          <div style="font-family:-apple-system,sans-serif;max-width:480px;margin:0 auto;padding:32px;background:#fff;border-radius:10px">
            <div style="background:#639922;border-radius:8px;padding:16px;text-align:center;margin-bottom:24px">
              <span style="color:#fff;font-size:18px;font-weight:700">VendorBeacon</span>
            </div>
            <h2 style="color:#2C2C2A;font-size:18px;margin:0 0 16px">New vendor signed up 🎉</h2>
            <table style="width:100%;border-collapse:collapse">
              <tr><td style="padding:8px 0;color:#5F5E5A;font-size:13px;border-bottom:1px solid #D3D1C7">Business name</td><td style="padding:8px 0;font-size:13px;font-weight:600;text-align:right;border-bottom:1px solid #D3D1C7">${vendor.business_name}</td></tr>
              <tr><td style="padding:8px 0;color:#5F5E5A;font-size:13px;border-bottom:1px solid #D3D1C7">Email</td><td style="padding:8px 0;font-size:13px;text-align:right;border-bottom:1px solid #D3D1C7">${vendor.contact_email}</td></tr>
              <tr><td style="padding:8px 0;color:#5F5E5A;font-size:13px">Public page</td><td style="padding:8px 0;font-size:13px;text-align:right"><a href="${publicUrl}" style="color:#639922">${publicUrl}</a></td></tr>
            </table>
            <a href="${appUrl}" style="display:block;margin-top:24px;background:#2C2C2A;color:#fff;text-decoration:none;padding:12px;border-radius:8px;text-align:center;font-size:13px;font-weight:600">View vendorbeacon.app →</a>
          </div>
        `,
      }).catch(() => {});
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Welcome email error:", err);
    return NextResponse.json({ error: "Failed to send welcome email" }, { status: 500 });
  }
}
