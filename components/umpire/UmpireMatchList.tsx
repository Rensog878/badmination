"use client";

import Link from "next/link";
import { sideName } from "@/components/live/CourtCard";
import StartMatchButton from "@/components/umpire/StartMatchButton";
import { useLiveFeed } from "@/components/live/useLiveFeed";
import type { LiveMatch, LiveSnapshot } from "@/lib/live/types";
import { ChevronRight, Radio, Trophy } from "lucide-react";

const scoreLine = (m: LiveMatch) =>
  m.games
    .filter((g) => g.a + g.b > 0)
    .map((g) => (m.winner === "b" ? `${g.b}–${g.a}` : `${g.a}–${g.b}`))
    .join(", ");

export default function UmpireMatchList({
  slug,
  initial,
}: {
  slug: string;
  initial: LiveSnapshot;
}) {
  const { snapshot, connection } = useLiveFeed(slug, initial);

  const live = snapshot.matches.filter((m) => m.status === "live");
  const scheduled = snapshot.matches.filter((m) => m.status === "scheduled");
  const finished = snapshot.matches
    .filter((m) => m.status === "finished")
    .sort((a, b) => (b.finishedAt ?? 0) - (a.finishedAt ?? 0));

  return (
    <div className="space-y-10">
      {/* Live Feed Status Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-4">
        <div className="flex items-center gap-2">
          <span
            className={`size-2.5 rounded-full ${
              connection === "live"
                ? "bg-court-green shadow-[0_0_8px_rgba(16,185,129,0.8)] animate-pulse"
                : "bg-amber-400"
            }`}
          />
          <span className="font-display text-xs font-bold tracking-[0.16em] uppercase text-off-white">
            {connection === "live" ? "Real-Time Umpire Sync Active" : "Connecting to Match Feed…"}
          </span>
        </div>
        <div className="flex items-center gap-3 text-xs font-medium text-muted">
          <span>{live.length} on court</span>
          <span>·</span>
          <span>{scheduled.length} in queue</span>
        </div>
      </div>

      {snapshot.demo && (
        <p className="rounded-xl border border-dashed border-amber-400/40 bg-amber-400/5 p-4 text-xs text-amber-200">
          Demo mode active: scoring or starting a match takes full control over the match.
        </p>
      )}

      {/* Section 1: In Play */}
      <section aria-labelledby="in-play-heading">
        <div className="flex items-center justify-between">
          <h2
            id="in-play-heading"
            className="flex items-center gap-2 font-display text-xs font-bold tracking-[0.18em] text-court-green uppercase"
          >
            <Radio className="size-3.5 animate-pulse text-court-green" />
            <span>In Play ({live.length})</span>
          </h2>
          <span className="text-xs text-muted">Tap Score to open scoring pad</span>
        </div>

        <ul className="mt-4 divide-y divide-white/10 rounded-2xl border border-white/10 bg-white/[0.02] overflow-hidden">
          {live.map((m) => {
            const currentScore = m.games[m.games.length - 1];
            return (
              <li
                key={m.id}
                className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between transition-colors hover:bg-white/[0.03]"
              >
                <div className="min-w-0 flex-1 space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="inline-flex items-center gap-1 rounded-full bg-court-green/20 px-2.5 py-0.5 font-display text-[11px] font-bold tracking-[0.18em] text-court-green uppercase">
                      Court {m.court ?? 1}
                    </span>
                    <span className="text-xs text-muted font-medium">
                      {m.event} · {m.round}
                    </span>
                    {m.controlledBy === "umpire" && (
                      <span className="rounded-md border border-white/10 bg-white/5 px-1.5 py-0.5 text-[10px] text-muted">
                        Official Scored
                      </span>
                    )}
                  </div>

                  <p className="font-display text-lg font-bold text-off-white truncate sm:text-xl">
                    {sideName(m, "a")} <span className="font-normal text-muted text-sm">vs</span> {sideName(m, "b")}
                  </p>

                  {currentScore && (
                    <p className="font-display text-xs font-bold tracking-[0.14em] text-muted uppercase">
                      Game {m.games.length}:{" "}
                      <span className="text-court-green tabular-nums">
                        {currentScore.a} – {currentScore.b}
                      </span>
                      {m.games.length > 1 && (
                        <span className="ml-2 font-normal text-muted/70">
                          (Prev: {m.games.slice(0, -1).map((g) => `${g.a}–${g.b}`).join(", ")})
                        </span>
                      )}
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-3">
                  <Link
                    href={`/umpire/${slug}/${m.id}`}
                    className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-court-green px-5 py-2.5 font-display text-xs font-bold tracking-[0.16em] text-black uppercase transition-all hover:bg-off-white hover:scale-[1.02] shadow-[0_0_15px_rgba(16,185,129,0.3)]"
                  >
                    <span>Score Match</span>
                    <ChevronRight className="size-4" />
                  </Link>
                </div>
              </li>
            );
          })}

          {live.length === 0 && (
            <li className="p-8 text-center text-sm text-muted">
              No matches currently in play on any court. Start a match from the queue below or assign courts in admin.
            </li>
          )}
        </ul>
      </section>

      {/* Section 2: Queue */}
      <section aria-labelledby="queue-heading">
        <div className="flex items-center justify-between">
          <h2
            id="queue-heading"
            className="font-display text-xs font-bold tracking-[0.18em] text-muted uppercase"
          >
            Match Queue ({scheduled.length})
          </h2>
          <span className="text-xs text-muted">Scheduled for call</span>
        </div>

        <ul className="mt-4 divide-y divide-white/10 rounded-2xl border border-white/10 bg-white/[0.02] overflow-hidden">
          {scheduled.map((m) => (
            <li
              key={m.id}
              className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between transition-colors hover:bg-white/[0.03]"
            >
              <div className="min-w-0 flex-1 space-y-1">
                <p className="text-xs text-muted font-medium">
                  {m.event} · {m.round}
                </p>
                <p className="font-display text-base font-bold text-off-white truncate sm:text-lg">
                  {sideName(m, "a")} <span className="font-normal text-muted text-sm">vs</span> {sideName(m, "b")}
                </p>
              </div>

              <div>
                <StartMatchButton slug={slug} matchId={m.id} />
              </div>
            </li>
          ))}

          {scheduled.length === 0 && (
            <li className="p-8 text-center text-sm text-muted">
              The match queue is empty. New matches added by tournament directors will appear here instantly.
            </li>
          )}
        </ul>
      </section>

      {/* Section 3: Completed Matches */}
      {finished.length > 0 && (
        <section aria-labelledby="completed-heading">
          <h2
            id="completed-heading"
            className="flex items-center gap-2 font-display text-xs font-bold tracking-[0.18em] text-muted uppercase"
          >
            <Trophy className="size-3.5 text-muted" />
            <span>Completed Today ({finished.length})</span>
          </h2>

          <ul className="mt-4 divide-y divide-white/10 rounded-2xl border border-white/10 bg-white/[0.02] overflow-hidden">
            {finished.map((m) => {
              const winnerName = m.winner ? sideName(m, m.winner) : null;
              return (
                <li
                  key={m.id}
                  className="flex flex-col gap-2 p-4 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div>
                    <span className="text-xs text-muted">
                      {m.event} · {m.round}
                    </span>
                    <p className="font-display text-sm font-semibold text-off-white">
                      {sideName(m, "a")} vs {sideName(m, "b")}
                    </p>
                    {winnerName && (
                      <p className="text-xs text-court-green font-medium">
                        Winner: {winnerName}
                      </p>
                    )}
                  </div>
                  <div className="font-display text-xs font-bold tabular-nums text-muted sm:text-right">
                    {scoreLine(m)}
                  </div>
                </li>
              );
            })}
          </ul>
        </section>
      )}
    </div>
  );
}
