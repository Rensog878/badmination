import type { Metadata } from "next";
import { findTournament } from "@/lib/data/tournaments";
import { notFound } from "next/navigation";
import BackButton from "@/components/ui/BackButton";
import Scoreboard from "@/components/live/Scoreboard";
import { SITE } from "@/lib/content";
import { ensureFeed, getSnapshot, liveAvailable } from "@/lib/live/store";

export const dynamic = "force-dynamic";

type PageProps = { params: Promise<{ slug: string; matchId: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const t = await findTournament((await params).slug);
  return t ? { title: `Scoreboard · ${t.name} | ${SITE.title}` } : {};
}

export default async function ScoreboardPage({ params }: PageProps) {
  const { slug, matchId } = await params;
  const t = await findTournament(slug);
  if (!t) notFound();
  await ensureFeed(t);
  if (!liveAvailable(t, Date.now()).available) notFound();
  const snapshot = getSnapshot(t);
  if (!snapshot.matches.some((m) => m.id === matchId)) notFound();

  return (
    <main id="main" className="min-h-svh bg-charcoal pt-28 pb-24 lg:pt-36">
      <div className="mx-auto max-w-[1600px] px-4 sm:px-8 lg:px-16">
        <BackButton fallbackHref={`/tournaments/${t.slug}/live`} label="All courts" />
        <h1 className="sr-only">Live scoreboard</h1>
        <div className="mt-8">
          <Scoreboard initial={snapshot} matchId={matchId} />
        </div>
      </div>
    </main>
  );
}
