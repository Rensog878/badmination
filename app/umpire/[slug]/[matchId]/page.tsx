import type { Metadata } from "next";
import { findTournament } from "@/lib/data/tournaments";
import { notFound } from "next/navigation";
import BackButton from "@/components/ui/BackButton";
import UmpireShell from "@/components/umpire/UmpireShell";
import ScoringPad from "@/components/umpire/ScoringPad";
import { ensureFeed, getSnapshot } from "@/lib/live/store";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Umpire scoring", robots: { index: false, follow: false } };

type PageProps = { params: Promise<{ slug: string; matchId: string }> };

export default async function UmpireScoringPage({ params }: PageProps) {
  const { slug, matchId } = await params;
  const t = await findTournament(slug);
  if (!t) notFound();

  await ensureFeed(t, { forceReal: true });
  const snapshot = getSnapshot(t);
  if (!snapshot.matches.some((m) => m.id === matchId)) notFound();

  return (
    <UmpireShell slug={slug} next={`/umpire/${slug}/${matchId}`}>
      <div className="mb-6">
        <BackButton fallbackHref={`/umpire/${slug}`} label="All matches" />
      </div>
      <ScoringPad initial={snapshot} matchId={matchId} />
    </UmpireShell>
  );
}
