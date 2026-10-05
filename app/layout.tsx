import type { Metadata, Viewport } from "next";
import { Outfit, Plus_Jakarta_Sans } from "next/font/google";
import SiteHeader from "@/components/nav/SiteHeader";
import SiteFooter from "@/components/footer/SiteFooter";
import MobileBottomNav from "@/components/nav/MobileBottomNav";
import PwaProvider from "@/components/pwa/PwaProvider";
import { SITE } from "@/lib/content";
import "./globals.css";

const plusJakartaSans = Plus_Jakarta_Sans({
  variable: "--font-plus-jakarta-sans",
  subsets: ["latin"],
  display: "swap",
});

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: SITE.title,
  description: SITE.description,
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Badmination",
  },
  icons: {
    icon: "/icon.svg",
    apple: "/icon.svg",
  },
};

export const viewport: Viewport = {
  themeColor: "#0A0A0A",
  colorScheme: "dark",
  width: "device-width",
  initialScale: 1,
  // Edge-to-edge on notched phones; fixed bars pad themselves with env(safe-area-inset-*).
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${plusJakartaSans.variable} ${outfit.variable}`}>
      <body className="min-h-svh bg-charcoal font-sans text-off-white antialiased">
        <a
          href="#main"
          className="rounded-lg sr-only bg-court-green px-4 py-2 font-display text-sm font-semibold text-black focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-[70]"
        >
          Skip to content
        </a>
        <SiteHeader />
        <PwaProvider>
          {children}
          <SiteFooter />
          <MobileBottomNav />
        </PwaProvider>
      </body>
    </html>
  );
}
