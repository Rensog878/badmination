"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Trophy,
  MapPin,
  Clock,
  ShieldCheck,
  Award,
  ExternalLink,
  Sliders,
  ChevronRight,
  Zap,
} from "lucide-react";
import { COACH_NAME, SITE } from "@/lib/content";

export default function SiteFooter() {
  const pathname = usePathname();

  // Omit on staff consoles
  if (pathname.startsWith("/admin") || pathname.startsWith("/umpire")) return null;

  const handleOpenOptions = () => {
    // Dispatch keyboard shortcut to open Studio Settings
    window.dispatchEvent(new KeyboardEvent("keydown", { key: ",", ctrlKey: true }));
  };

  return (
    <footer
      aria-labelledby="footer-heading"
      className="relative z-10 border-t border-off-white/10 bg-black/95 text-off-white overflow-hidden print:hidden"
    >
      {/* Glow highlight along the top border */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-court-green/60 to-transparent"
      />

      {/* Championship Affiliation Marquee Ribbon */}
      <div className="border-b border-off-white/5 bg-charcoal/60 px-4 py-3.5 backdrop-blur-md">
        <div className="mx-auto flex max-w-[1600px] flex-wrap items-center justify-between gap-4 px-4 sm:px-8 lg:px-16">
          <div className="flex flex-wrap items-center gap-6 sm:gap-8 text-xs font-semibold text-muted">
            <div className="flex items-center gap-2 text-off-white">
              <ShieldCheck className="size-4 text-court-green" />
              <span className="font-display tracking-wider uppercase text-[11px]">BWF Rules Compliant</span>
            </div>
            <div className="flex items-center gap-2">
              <Award className="size-4 text-court-green" />
              <span className="font-display tracking-wider uppercase text-[11px]">Certified National Coaching</span>
            </div>
            <div className="flex items-center gap-2">
              <Zap className="size-4 text-amber-400" />
              <span className="font-display tracking-wider uppercase text-[11px]">Yonex AS-30 Tour Shuttles</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="relative flex size-2">
              <span className="absolute inline-flex size-full animate-ping rounded-full bg-court-green opacity-75" />
              <span className="relative inline-flex size-2 rounded-full bg-court-green shadow-[0_0_8px_rgba(16,185,129,0.8)]" />
            </span>
            <span className="font-display text-[11px] font-bold tracking-widest text-court-green uppercase">
              Arena Active · 06:00 AM – 10:00 PM IST
            </span>
          </div>
        </div>
      </div>

      {/* Main Footer Directory */}
      <div className="mx-auto max-w-[1600px] px-4 py-16 sm:px-8 lg:px-16 lg:py-20">
        <h2 id="footer-heading" className="sr-only">
          Site Footer & Directory
        </h2>

        <div className="grid grid-cols-1 gap-12 sm:grid-cols-2 lg:grid-cols-12 lg:gap-12">
          {/* Col 1: Brand & Live Arena Info */}
          <div className="lg:col-span-4 space-y-5">
            <div className="flex items-center gap-2.5">
              <div className="flex size-9 items-center justify-center rounded-xl border border-court-green/30 bg-court-green/10 text-court-green shadow-[0_0_15px_rgba(16,185,129,0.2)]">
                <Trophy className="size-4" />
              </div>
              <span className="font-display text-lg font-black tracking-[0.16em] uppercase text-off-white">
                {COACH_NAME}
              </span>
            </div>

            <p className="max-w-sm text-sm leading-relaxed text-muted">
              {SITE.description}
            </p>

            <div className="rounded-xl border border-off-white/10 bg-white/[0.02] p-4 space-y-2.5">
              <div className="flex items-center gap-2 text-xs font-semibold text-off-white">
                <Clock className="size-3.5 text-court-green" />
                <span>Court Hours & Facility Schedule</span>
              </div>
              <p className="text-xs text-muted leading-relaxed">
                Morning Session: 06:00 AM – 11:30 AM<br />
                Evening Tournament Play: 04:00 PM – 10:00 PM
              </p>
              <div className="pt-1 flex items-center gap-2 text-[11px] text-muted">
                <span className="text-court-green font-bold">Pro Shop:</span> High-tension Yonex stringing available on-site.
              </div>
            </div>
          </div>

          {/* Col 2: Competitions & Tournament Draws */}
          <div className="lg:col-span-3 space-y-4">
            <h3 className="font-display text-xs font-bold tracking-[0.2em] uppercase text-off-white">
              Competitions
            </h3>
            <ul className="space-y-2.5 text-sm">
              <li>
                <Link
                  href="/#tournaments"
                  className="group flex items-center gap-1.5 text-muted hover:text-court-green transition-colors"
                >
                  <ChevronRight className="size-3 transition-transform group-hover:translate-x-0.5" />
                  <span>Sanctioned Tournaments</span>
                </Link>
              </li>
              <li>
                <Link
                  href="/live"
                  className="group flex items-center gap-1.5 text-muted hover:text-court-green transition-colors"
                >
                  <ChevronRight className="size-3 transition-transform group-hover:translate-x-0.5" />
                  <span className="inline-flex items-center gap-2">
                    <span>Live Match Hub</span>
                    <span className="rounded bg-red-600/80 px-1.5 py-0.2 font-display text-[9px] font-bold text-white uppercase tracking-wider">
                      Live
                    </span>
                  </span>
                </Link>
              </li>
              <li>
                <Link
                  href="/#tournaments"
                  className="group flex items-center gap-1.5 text-muted hover:text-court-green transition-colors"
                >
                  <ChevronRight className="size-3 transition-transform group-hover:translate-x-0.5" />
                  <span>Knockout Brackets & Draws</span>
                </Link>
              </li>
              <li>
                <Link
                  href="/#tournaments"
                  className="group flex items-center gap-1.5 text-muted hover:text-court-green transition-colors"
                >
                  <ChevronRight className="size-3 transition-transform group-hover:translate-x-0.5" />
                  <span>Rules & BWF Code of Conduct</span>
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 3: Academy Training & Masterclass */}
          <div className="lg:col-span-2 space-y-4">
            <h3 className="font-display text-xs font-bold tracking-[0.2em] uppercase text-off-white">
              Academy
            </h3>
            <ul className="space-y-2.5 text-sm">
              <li>
                <Link
                  href="/#coach"
                  className="group flex items-center gap-1.5 text-muted hover:text-court-green transition-colors"
                >
                  <ChevronRight className="size-3 transition-transform group-hover:translate-x-0.5" />
                  <span>Coach {COACH_NAME}</span>
                </Link>
              </li>
              <li>
                <Link
                  href="/#programs"
                  className="group flex items-center gap-1.5 text-muted hover:text-court-green transition-colors"
                >
                  <ChevronRight className="size-3 transition-transform group-hover:translate-x-0.5" />
                  <span>Junior Development</span>
                </Link>
              </li>
              <li>
                <Link
                  href="/#programs"
                  className="group flex items-center gap-1.5 text-muted hover:text-court-green transition-colors"
                >
                  <ChevronRight className="size-3 transition-transform group-hover:translate-x-0.5" />
                  <span>Elite Competition Squad</span>
                </Link>
              </li>
              <li>
                <Link
                  href="/#programs"
                  className="group flex items-center gap-1.5 text-muted hover:text-court-green transition-colors"
                >
                  <ChevronRight className="size-3 transition-transform group-hover:translate-x-0.5" />
                  <span>Trial Assessment Booking</span>
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 4: Location & Official Portals */}
          <div className="lg:col-span-3 space-y-4">
            <h3 className="font-display text-xs font-bold tracking-[0.2em] uppercase text-off-white">
              Arena Headquarters
            </h3>

            <div className="flex items-start gap-2.5 text-xs text-muted leading-relaxed">
              <MapPin className="size-4 text-court-green shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-off-white">District Sports Complex Arena</p>
                <p>Beach Road, Near Silver Beach</p>
                <p>Cuddalore, Tamil Nadu 607001</p>
                <a
                  href="https://maps.google.com/?q=Cuddalore+District+Sports+Complex"
                  target="_blank"
                  rel="noreferrer"
                  className="mt-2 inline-flex items-center gap-1 text-[11px] font-bold text-court-green hover:underline"
                >
                  <span>Open in Google Maps</span>
                  <ExternalLink className="size-3" />
                </a>
              </div>
            </div>

            <div className="pt-2 border-t border-off-white/10 space-y-2">
              <p className="font-display text-[10px] font-bold tracking-[0.16em] uppercase text-muted">
                Official Staff Access
              </p>
              <div className="flex flex-wrap gap-2">
                <Link
                  href="/admin"
                  className="inline-flex items-center gap-1.5 rounded-lg border border-off-white/15 bg-white/[0.03] px-2.5 py-1.5 text-[11px] font-semibold text-muted hover:border-court-green/50 hover:text-court-green transition-all"
                >
                  <span>Admin Desk</span>
                </Link>
                <Link
                  href="/admin/settings"
                  className="inline-flex items-center gap-1.5 rounded-lg border border-off-white/15 bg-white/[0.03] px-2.5 py-1.5 text-[11px] font-semibold text-muted hover:border-court-green/50 hover:text-court-green transition-all"
                >
                  <span>Feature Matrix</span>
                </Link>
                <button
                  type="button"
                  onClick={handleOpenOptions}
                  className="inline-flex items-center gap-1 rounded-lg border border-court-green/40 bg-court-green/10 px-2.5 py-1.5 text-[11px] font-semibold text-court-green hover:bg-court-green hover:text-black transition-all"
                >
                  <Sliders className="size-3" />
                  <span>Studio Options</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Utility Bar */}
        <div className="mt-14 flex flex-col items-center justify-between gap-4 border-t border-off-white/10 pt-8 text-xs text-muted sm:flex-row">
          <p>
            © {new Date().getFullYear()} {COACH_NAME} Badminton Arena. All rights reserved.
          </p>
          <div className="flex items-center gap-4 text-[11px]">
            <span>Official BWF Scoring System</span>
            <span>·</span>
            <span>Yonex BWF Approved Equipment</span>
            <span>·</span>
            <Link href="/offline" className="hover:text-off-white transition-colors">
              PWA Offline
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
