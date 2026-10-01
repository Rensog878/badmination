import type { Metadata } from "next";
import { findTournament } from "@/lib/data/tournaments";
import Link from "next/link";
import { notFound } from "next/navigation";
import { sideName } from "@/components/live/CourtCard";
import StartMatchButton from "@/components/umpire/StartMatchButton";
import UmpireShell from "@/components/umpire/UmpireShell";
import { ensureFeed, getSnapshot, liveAvailable } from "@/lib/live/store";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Umpire console", robots: { index: false, follow: false } };

type PageProps = { params: Promise<{ slug: string }> };

export default async function UmpireMatchesPage({ params }: PageProps) {
  const { slug } = await params;
  const t = await findTournament(slug);
  if (!t) notFound();
  const available = liveAvailable(t, Date.now()).available;
  if (available) await ensureFeed(t);
  const snapshot = available ? getSnapshot(t) : null;
  const live = snapshot?.matches.filter((m) => m.status === "live") ?? [];
  const scheduled = snapshot?.matches.filter((m) => m.status === "scheduled") ?? [];

  return (
    <UmpireShell slug={slug} next={`/umpire/${slug}`}>
      {snapshot?.demo && <p className="mb-6 text-sm text-muted">Demo feed: scoring a match takes it over from the simulator.</p>}
      <section aria-labelledby="in-play">
        <h2 id="in-play" className="font-display text-xs font-medium tracking-[0.18em] text-muted uppercase">In play</h2>
        <ul className="mt-4 divide-y divide-off-white/10 border-y border-off-white/10">
          {live.map((m) => (
            <li key={m.id} className="flex items-center justify-between gap-4 py-4">
              <span>
                <span className="font-display text-xs tracking-[0.2em] text-court-green uppercase">Court {m.court}</span>
                <span className="block font-semibold">
                  {sideName(m, "a")} <span className="text-muted">vs</span> {sideName(m, "b")}
                </span>
                <span className="text-xs text-muted">
                  {m.event} · {m.round}
                  {m.controlledBy === "umpire" ? " · umpire scoring" : ""}
                </span>
              </span>
              <Link
                href={`/umpire/${slug}/${m.id}`}
                className="rounded-lg bg-court-green px-4 py-2 font-display text-xs font-semibold tracking-[0.18em] text-black uppercase hover:bg-off-white"
              >
                Score
              </Link>
            </li>
          ))}
          {live.length === 0 && <li className="py-4 text-sm text-muted">No matches in play.</li>}
        </ul>
      </section>
      <section aria-labelledby="queue" className="mt-12">
        <h2 id="queue" className="font-display text-xs font-medium tracking-[0.18em] text-muted uppercase">Queue</h2>
        <ul className="mt-4 divide-y divide-off-white/10 border-y border-off-white/10">
          {scheduled.map((m) => (
            <li key={m.id} className="flex items-center justify-between gap-4 py-4">
              <span>
                <span className="block font-semibold">
                  {sideName(m, "a")} <span className="text-muted">vs</span> {sideName(m, "b")}
                </span>
                <span className="text-xs text-muted">
                  {m.event} · {m.round}
                </span>
              </span>
              <StartMatchButton slug={slug} matchId={m.id} />
            </li>
          ))}
          {scheduled.length === 0 && <li className="py-4 text-sm text-muted">Queue is empty.</li>}
        </ul>
      </section>
    </UmpireShell>
  );
}
