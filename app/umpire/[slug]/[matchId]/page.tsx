import type { Metadata } from "next";
import { findTournament } from "@/lib/data/tournaments";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import UmpireShell from "@/components/umpire/UmpireShell";
import ScoringPad from "@/components/umpire/ScoringPad";
import { ensureFeed, getSnapshot, liveAvailable } from "@/lib/live/store";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Umpire scoring", robots: { index: false, follow: false } };

type PageProps = { params: Promise<{ slug: string; matchId: string }> };

export default async function UmpireScoringPage({ params }: PageProps) {
  const { slug, matchId } = await params;
  const t = await findTournament(slug);
  if (!t) notFound();
  const available = liveAvailable(t, Date.now()).available;
  if (available) await ensureFeed(t);
  const snapshot = available ? getSnapshot(t) : null;
  if (snapshot && !snapshot.matches.some((m) => m.id === matchId)) notFound();

  return (
    <UmpireShell slug={slug} next={`/umpire/${slug}/${matchId}`}>
      <Link
        href={`/umpire/${slug}`}
        className="mb-8 inline-flex items-center gap-2 font-display text-xs tracking-[0.15em] text-muted uppercase hover:text-off-white"
      >
        <ArrowLeft aria-hidden="true" className="size-4" />
        All matches
      </Link>
      {snapshot && <ScoringPad initial={snapshot} matchId={matchId} />}
    </UmpireShell>
  );
}
