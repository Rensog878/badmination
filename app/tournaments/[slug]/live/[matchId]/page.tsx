import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import Scoreboard from "@/components/live/Scoreboard";
import { SITE } from "@/lib/content";
import { getSnapshot, liveAvailable } from "@/lib/live/store";
import { getTournament } from "@/lib/tournaments";

export const dynamic = "force-dynamic";

type PageProps = { params: Promise<{ slug: string; matchId: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const t = getTournament((await params).slug);
  return t ? { title: `Scoreboard · ${t.name} | ${SITE.title}` } : {};
}

export default async function ScoreboardPage({ params }: PageProps) {
  const { slug, matchId } = await params;
  const t = getTournament(slug);
  if (!t || !liveAvailable(t, Date.now()).available) notFound();
  const snapshot = getSnapshot(t);
  if (!snapshot.matches.some((m) => m.id === matchId)) notFound();

  return (
    <main id="main" className="min-h-svh bg-charcoal pt-28 pb-24 lg:pt-36">
      <div className="mx-auto max-w-[1600px] px-4 sm:px-8 lg:px-16">
        <Link
          href={`/tournaments/${t.slug}/live`}
          className="inline-flex items-center gap-2 font-display text-xs tracking-[0.25em] text-muted uppercase transition-colors hover:text-off-white"
        >
          <ArrowLeft aria-hidden="true" className="size-4" />
          All courts
        </Link>
        <h1 className="sr-only">Live scoreboard</h1>
        <div className="mt-8">
          <Scoreboard initial={snapshot} matchId={matchId} />
        </div>
      </div>
    </main>
  );
}
