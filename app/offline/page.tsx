import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, WifiOff } from "lucide-react";
import ReconnectButton from "@/components/pwa/ReconnectButton";
import { SITE } from "@/lib/content";

export const metadata: Metadata = {
  title: `Offline Stadium Mode | ${SITE.title}`,
  description: "Offline access for tournament player passes and schedules.",
};

export default function OfflinePage() {
  return (
    <main id="main" className="min-h-svh bg-charcoal pt-28 pb-24 lg:pt-36 flex items-center justify-center px-4 sm:px-8">
      <div className="mx-auto max-w-lg text-center">
        <div className="mx-auto flex size-20 items-center justify-center rounded-3xl border border-court-green/30 bg-court-green/10 shadow-[0_0_30px_rgba(16,185,129,0.2)]">
          <WifiOff aria-hidden="true" className="size-10 text-court-green" />
        </div>

        <span className="mt-6 inline-flex items-center gap-1.5 rounded-full border border-court-green/40 bg-court-green/10 px-3.5 py-1 font-display text-xs font-bold tracking-[0.16em] uppercase text-court-green">
          Offline Stadium Mode
        </span>

        <h1 className="mt-4 font-display text-3xl font-black uppercase text-off-white sm:text-4xl">
          Network Disconnected
        </h1>

        <p className="mt-3 text-sm text-muted sm:text-base leading-relaxed">
          Indoor badminton arenas often shield cellular signals. Don&apos;t worry—your previously opened pages, brackets, and Player Passes remain stored on your device.
        </p>

        <div className="mt-8 rounded-2xl border border-off-white/10 bg-black/60 p-5 text-left text-xs space-y-3">
          <p className="font-display font-bold uppercase tracking-wider text-off-white">
            Available while offline:
          </p>
          <ul className="space-y-2 text-muted">
            <li className="flex items-center gap-2">
              <span className="size-1.5 rounded-full bg-court-green" />
              <span>Digital Player Pass & Desk QR code (from Confirmation)</span>
            </li>
            <li className="flex items-center gap-2">
              <span className="size-1.5 rounded-full bg-court-green" />
              <span>Cached tournament rules, venues, and schedules</span>
            </li>
            <li className="flex items-center gap-2">
              <span className="size-1.5 rounded-full bg-court-green" />
              <span>Instant automatic reconnect when signal returns</span>
            </li>
          </ul>
        </div>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <ReconnectButton />

          <Link
            href="/"
            className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-off-white/15 px-6 py-3 font-display text-xs font-bold tracking-[0.16em] uppercase text-off-white hover:bg-off-white/5 transition-colors"
          >
            <ArrowLeft className="size-4" />
            <span>Home</span>
          </Link>
        </div>
      </div>
    </main>
  );
}
