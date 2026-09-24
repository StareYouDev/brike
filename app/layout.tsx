import type { Metadata, Viewport } from "next";
import { Instrument_Serif, Poppins, Work_Sans } from "next/font/google";
import "./globals.css";
import { site } from "@/data/catalog";

const instrumentSerif = Instrument_Serif({
  variable: "--font-instrument",
  subsets: ["latin"],
  weight: "400",
  style: ["normal", "italic"],
  display: "swap",
});

const poppins = Poppins({
  variable: "--font-poppins",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  style: ["normal", "italic"],
  display: "swap",
});

const workSans = Work_Sans({
  variable: "--font-worksans",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
  ),
  title: {
    default: `${site.name} — Ladies', Kids' & Men's Pyjamas, Nightwear and Home`,
    template: `%s — ${site.name}`,
  },
  description: site.description,
  applicationName: site.name,
  keywords: [
    "pyjamas",
    "nightwear",
    "boutique sleepwear",
    "hand-drawn prints",
    "cotton pyjamas",
    "matching pyjamas",
    "UK",
  ],
  openGraph: {
    type: "website",
    siteName: site.name,
    title: `${site.name} — Boutique Pyjamas & Nightwear`,
    description: site.description,
  },
};

export const viewport: Viewport = {
  themeColor: "#f2c1ae",
  colorScheme: "light",
};

/**
 * Root layout: html/body/fonts/site metadata only. Storefront chrome
 * (header/footer/cart) lives in app/(storefront)/layout.tsx so /admin gets a
 * chrome-free shell and the storefront 404 keeps the chrome.
 */
export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en-GB"
      className={`${instrumentSerif.variable} ${poppins.variable} ${workSans.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">{children}</body>
    </html>
  );
}
