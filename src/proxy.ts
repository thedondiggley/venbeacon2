import { type NextRequest, NextResponse } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

// Public routes that don't require auth
const PUBLIC_PATHS = [
  "/",
  "/login",
  "/signup",
  "/pricing",
  "/list-your-venue",
  "/onboarding",
  "/forgot-password",
  "/reset-password",
  "/terms",
  "/privacy",
  "/refund",
  "/guidelines",
  "/contact",
  "/verify-result",
  "/t/",
  "/venue/",
  "/api/stripe/webhook",
  "/api/bookings",
  "/api/venue-listings",
  "/api/venue-listings/edit",
  "/api/venue-listings/verify",
  "/api/venue-listings/refresh-link",
  "/api/contact",
];

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip auth check for public paths
  const isPublic = PUBLIC_PATHS.some(p => pathname === p || pathname.startsWith(p));
  if (isPublic) return NextResponse.next();

  return await updateSession(request);
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|logo.png|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
