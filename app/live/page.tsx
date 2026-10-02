import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Trophy } from "lucide-react";
import LiveHub, { type LiveTournamentItem } from "@/components/live/LiveHub";
import { SITE } from "@/lib/content";
import { listTournaments } from "@/lib/data/tournaments";
import { ensureFeed, getSnapshot, liveAvailable } from "@/lib/live/store";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: `Live Command Hub | ${SITE.title}`,
  description: "Live broadcast scores, multi-court command center, and point-by-point momentum across tournaments.",
};

export default async function AllLivePage() {
  const now = Date.now();
  const allTournaments = await listTournaments();

  const live = allTournaments
    .map((t) => ({ t, ...liveAvailable(t, now) }))
    .filter((x) => x.available)
    .sort((x, y) => Number(x.demo) - Number(y.demo));

  // Ensure all live feeds are loaded from DB or inited in memory
  await Promise.all(live.map(({ t }) => ensureFeed(t)));

  const items: LiveTournamentItem[] = live.map(({ t, demo }) => ({
    tournament: t,
    initial: getSnapshot(t),
    demo,
  }));

  return (
    <main id="main" className="min-h-svh bg-charcoal pt-24 pb-24 lg:pt-32">
      <div className="mx-auto max-w-[1600px] px-4 sm:px-8 lg:px-16">
        {items.length === 0 ? (
          <div className="mx-auto max-w-xl text-center py-20">
            <div className="mx-auto flex size-14 items-center justify-center rounded-full border border-off-white/15 bg-black/40">
              <Trophy aria-hidden="true" className="size-6 text-court-green" />
            </div>
            <h1 className="mt-6 font-display text-3xl font-bold uppercase sm:text-4xl">
              No Matches In Play
            </h1>
            <p className="mt-3 text-muted text-sm sm:text-base">
              Courts are currently resting. Real-time scores and live court radar activate automatically as soon as play begins.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href="/#tournaments"
                className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-court-green px-6 py-3 font-display text-xs font-semibold tracking-[0.18em] text-black uppercase hover:bg-off-white"
              >
                Browse Upcoming Tournaments
                <ArrowRight aria-hidden="true" className="size-4" />
              </Link>
            </div>
          </div>
        ) : (
          <LiveHub items={items} />
        )}
      </div>
    </main>
  );
}
