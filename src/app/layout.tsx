import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import { SvgSprite } from "@/components/SvgSprite";
import { SITE_URL } from "@/lib/env";
import "./globals.css";

// Self-hosted from the approved design reference (razed-ui-source/fonts).
const display = localFont({
  src: [
    { path: "./fonts/bodoni-moda-latin-400-normal.woff2", weight: "400", style: "normal" },
    { path: "./fonts/bodoni-moda-latin-400-italic.woff2", weight: "400", style: "italic" },
    { path: "./fonts/bodoni-moda-latin-500-normal.woff2", weight: "500", style: "normal" },
    { path: "./fonts/bodoni-moda-latin-600-normal.woff2", weight: "600", style: "normal" },
  ],
  variable: "--nf-display",
  display: "swap",
  fallback: ["Didot", "Georgia", "serif"],
});

const sans = localFont({
  src: [
    { path: "./fonts/jost-latin-300-normal.woff2", weight: "300", style: "normal" },
    { path: "./fonts/jost-latin-400-normal.woff2", weight: "400", style: "normal" },
    { path: "./fonts/jost-latin-500-normal.woff2", weight: "500", style: "normal" },
  ],
  variable: "--nf-sans",
  display: "swap",
  fallback: ["Futura", "Century Gothic", "system-ui", "sans-serif"],
});

const mark = localFont({
  src: [{ path: "./fonts/italiana-latin-400-normal.woff2", weight: "400", style: "normal" }],
  variable: "--nf-mark",
  display: "swap",
  fallback: ["Didot", "Georgia", "serif"],
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Razed by Ahmad — Extrait de Parfum, Karachi",
    template: "%s · Razed by Ahmad",
  },
  description:
    "Six extraits built from smoke, resin and oud. Blended in Karachi in batches of fifty, bottled by hand. Order on WhatsApp — cash on delivery nationwide.",
  applicationName: "Razed by Ahmad",
  openGraph: {
    type: "website",
    siteName: "Razed by Ahmad",
    locale: "en_PK",
  },
  twitter: { card: "summary_large_image" },
  appleWebApp: { capable: true, title: "Razed", statusBarStyle: "black-translucent" },
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/icons/icon-192.png", type: "image/png", sizes: "192x192" },
    ],
    apple: [{ url: "/icons/apple-touch-icon.png", sizes: "180x180" }],
  },
};

export const viewport: Viewport = {
  themeColor: "#07060A",
  colorScheme: "dark",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${display.variable} ${sans.variable} ${mark.variable}`}>
      <body>
        <SvgSprite />
        {children}
      </body>
    </html>
  );
}
