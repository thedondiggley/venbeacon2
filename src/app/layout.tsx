import type { Metadata, Viewport } from "next";
import "./globals.css";

export const viewport: Viewport = {
  themeColor: "#639922",
  width: "device-width",
  initialScale: 1,
};

export const metadata: Metadata = {
  title: { default: "VendorBeacon", template: "%s | VendorBeacon" },
  description: "Food truck scheduling, venue discovery, and booking management. Find new locations, accept bookings, and grow your business.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "VendorBeacon",
  },
  icons: {
    icon: [
      { url: "/favicon-v2.ico", sizes: "any" },
      { url: "/icon-192.png", type: "image/png", sizes: "192x192" },
      { url: "/icon-512.png", type: "image/png", sizes: "512x512" },
    ],
    apple: "/apple-touch-icon.png",
    shortcut: "/favicon-v2.ico",
  },
  other: {
    "mobile-web-app-capable": "yes",
    "apple-mobile-web-app-capable": "yes",
    "apple-mobile-web-app-status-bar-style": "default",
    "apple-mobile-web-app-title": "VendorBeacon",
    "application-name": "VendorBeacon",
    "msapplication-TileColor": "#639922",
    "msapplication-TileImage": "/icon-192.png",
  },
};

import { SpeedInsights } from "@vercel/speed-insights/next";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full antialiased">
      <head>
        <link rel="icon" href="/favicon-v2.ico" sizes="any" />
        <link rel="icon" href="/icon-192.png" type="image/png" sizes="192x192" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#639922" />
      </head>
      <body className="min-h-full flex flex-col">
        {children}
        <SpeedInsights />
      </body>
    </html>
  );
}
