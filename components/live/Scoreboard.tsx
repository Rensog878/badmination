"use client";

import { useEffect, useRef, useState } from "react";
import { Expand, Minimize } from "lucide-react";
import { sideName } from "@/components/live/CourtCard";
import { useLiveFeed } from "@/components/live/useLiveFeed";
import { gameWinner, gamesWon, pressurePoint, type Side } from "@/lib/live/scoring";
import type { LiveMatch, LiveSnapshot } from "@/lib/live/types";

const SIDES: Side[] = ["a", "b"];

/** Rallies of the game in progress (each rally adds exactly one point). */
export const currentGameRallies = (m: LiveMatch) => {
  const g = m.games[m.games.length - 1];
  const n = g ? g.a + g.b : 0;
  return n ? m.history.slice(-n) : [];
};

/** Re-renders every second after mount (null during SSR to avoid mismatches). */
function useNow(intervalMs = 1000) {
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => {
    const tick = () => setNow(Date.now());
    tick();
    const id = setInterval(tick, intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);
  return now;
}

function elapsed(from: number | null, to: number | null) {
  if (!from || !to) return "—";
  const mins = Math.max(0, Math.floor((to - from) / 60_000));
  return `${mins}′`;
}

export default function Scoreboard({ initial, matchId }: { initial: LiveSnapshot; matchId: string }) {
  const { snapshot, connection } = useLiveFeed(initial.slug, initial);
  const match = snapshot.matches.find((m) => m.id === matchId);
  const frame = useRef<HTMLDivElement>(null);
  const [fullscreen, setFullscreen] = useState(false);
  const now = useNow();

  useEffect(() => {
    const onChange = () => setFullscreen(document.fullscreenElement === frame.current);
    document.addEventListener("fullscreenchange", onChange);
    return () => document.removeEventListener("fullscreenchange", onChange);
  }, []);

  const toggleFullscreen = () => {
    if (document.fullscreenElement) void document.exitFullscreen();
    else void frame.current?.requestFullscreen?.();
  };

  if (!match) {
    return <p className="border border-off-white/15 p-8 text-lg">This match is no longer in the live feed. See the dashboard for results.</p>;
  }

  const finished = match.status === "finished";
  const current = match.games[match.games.length - 1] ?? { a: 0, b: 0 };
  const completed = match.games.filter((g) => gameWinner(g));
  const columns = finished ? match.games : completed;
  const pressure = pressurePoint(match.games);
  const rallies = currentGameRallies(match);
  const statusLabel = finished ? "Final" : match.status === "scheduled" ? "Not started" : `Game ${match.games.length || 1}`;

  return (
    <div ref={frame} className="bg-charcoal">
      <div className={`flex flex-col ${fullscreen ? "min-h-svh justify-center p-[4vw]" : ""}`}>
        {snapshot.demo && !fullscreen && (
          <p role="note" className="mb-6 text-sm text-muted">
            <span className="font-display font-semibold tracking-[0.15em] text-court-green uppercase">Demo feed · </span>
            simulated match.
          </p>
        )}

        <header className="flex flex-wrap items-center justify-between gap-4 border-b border-off-white/10 pb-5">
          <p className="font-display text-xs tracking-[0.18em] uppercase">
            {match.court ? `Court ${match.court} · ` : ""}
            {match.event} · {match.round}
          </p>
          <div className="flex items-center gap-5">
            <p className="font-display text-xs tracking-[0.15em] text-muted uppercase tabular-nums">
              {statusLabel} · {elapsed(match.startedAt, finished ? match.finishedAt : now)}
            </p>
            <p className="flex items-center gap-2 font-display text-xs font-semibold tracking-[0.2em] uppercase">
              <span aria-hidden="true" className={`size-2 rounded-full ${connection === "live" ? "bg-court-green" : "bg-muted"}`} />
              {connection === "live" ? "Live" : "Reconnecting"}
            </p>
            <button
              type="button"
              onClick={toggleFullscreen}
              aria-label={fullscreen ? "Exit full screen" : "Full screen"}
              className="inline-flex size-10 items-center justify-center border border-off-white/15 hover:border-court-green hover:text-court-green"
            >
              {fullscreen ? <Minimize aria-hidden="true" className="size-4" /> : <Expand aria-hidden="true" className="size-4" />}
            </button>
          </div>
        </header>

        {/* Visual scoreboard; the sr-only summary below carries the same information. */}
        <div aria-hidden="true" className="divide-y divide-off-white/10">
          {SIDES.map((side) => {
            const won = finished && match.winner === side;
            const serving = !finished && match.server === side;
            return (
              <div key={side} className="grid grid-cols-[1fr_auto] items-center gap-4 py-6 sm:grid-cols-[1fr_auto_auto] sm:gap-8 sm:py-8">
                <div className="flex min-w-0 items-center gap-3 sm:gap-4">
                  <span className={`size-3 shrink-0 rounded-full sm:size-4 ${serving ? "bg-court-green" : "bg-transparent"}`} />
                  <p className={`truncate font-display text-[clamp(1.5rem,4.5vw,4rem)] leading-none font-bold uppercase ${won ? "text-court-green" : ""}`}>
                    {sideName(match, side)}
                  </p>
                </div>
                <div className="hidden gap-3 font-display text-[clamp(1.25rem,2.5vw,2.25rem)] tabular-nums sm:flex">
                  {columns.map((g, i) => (
                    <span key={i} className={`w-[2.2ch] text-right ${gameWinner(g) === side ? "text-off-white" : "text-muted"}`}>
                      {g[side]}
                    </span>
                  ))}
                </div>
                {!finished && (
                  <span
                    key={`${side}-${current[side]}-${match.games.length}`}
                    className="animate-score-flash min-w-[2ch] text-right font-display text-[clamp(4rem,13vw,12rem)] leading-[0.85] font-bold tabular-nums"
                  >
                    {current[side]}
                  </span>
                )}
                {finished && (
                  <span className="font-display text-[clamp(3rem,8vw,7rem)] leading-none font-bold tabular-nums">
                    {gamesWon(match.games, side)}
                  </span>
                )}
              </div>
            );
          })}
        </div>

        <footer className="flex flex-wrap items-center justify-between gap-4 border-t border-off-white/10 pt-5">
          <div aria-hidden="true" className="flex flex-wrap items-center gap-1" title="Rallies this game">
            {rallies.map((r, i) => (
              <span key={i} className={`h-4 w-1.5 ${r.side === "a" ? "-translate-y-1 bg-court-green" : "translate-y-1 bg-off-white/50"}`} />
            ))}
          </div>
          {pressure && !finished && (
            <p className="rounded-lg bg-court-green px-3 py-1 font-display text-sm font-semibold tracking-[0.2em] text-black uppercase">
              {pressure.kind === "match" ? "Match point" : "Game point"} · {sideName(match, pressure.side)}
            </p>
          )}
          {finished && match.winner && (
            <p className="font-display text-sm font-semibold tracking-[0.2em] text-court-green uppercase">
              {sideName(match, match.winner)} win
            </p>
          )}
        </footer>

        <p className="sr-only" aria-live="polite">
          {finished && match.winner
            ? `Final. ${sideName(match, match.winner)} won, ${match.games.map((g) => `${g.a}–${g.b}`).join(", ")}.`
            : `${sideName(match, "a")} ${current.a}, ${sideName(match, "b")} ${current.b}. ${statusLabel}. Games ${gamesWon(match.games, "a")}–${gamesWon(match.games, "b")}.${
                pressure ? ` ${pressure.kind === "match" ? "Match" : "Game"} point ${sideName(match, pressure.side)}.` : ""
              }`}
        </p>
      </div>
    </div>
  );
}
