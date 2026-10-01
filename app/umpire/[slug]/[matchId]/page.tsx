import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import UmpireShell from "@/components/umpire/UmpireShell";
import ScoringPad from "@/components/umpire/ScoringPad";
import { getSnapshot, liveAvailable } from "@/lib/live/store";
import { getTournament } from "@/lib/tournaments";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Umpire scoring", robots: { index: false, follow: false } };

type PageProps = { params: Promise<{ slug: string; matchId: string }> };

export default async function UmpireScoringPage({ params }: PageProps) {
  const { slug, matchId } = await params;
  const t = getTournament(slug);
  if (!t) notFound();
  const snapshot = liveAvailable(t, Date.now()).available ? getSnapshot(t) : null;
  if (snapshot && !snapshot.matches.some((m) => m.id === matchId)) notFound();

  return (
    <UmpireShell slug={slug} next={`/umpire/${slug}/${matchId}`}>
      <Link
        href={`/umpire/${slug}`}
        className="mb-8 inline-flex items-center gap-2 font-display text-xs tracking-[0.25em] text-muted uppercase hover:text-off-white"
      >
        <ArrowLeft aria-hidden="true" className="size-4" />
        All matches
      </Link>
      {snapshot && <ScoringPad initial={snapshot} matchId={matchId} />}
    </UmpireShell>
  );
}
