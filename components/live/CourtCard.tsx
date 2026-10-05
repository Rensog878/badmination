import Link from "next/link";
import { Tv } from "lucide-react";
import { gameWinner, gamesWon, pressurePoint, type Side } from "@/lib/live/scoring";
import type { LiveMatch } from "@/lib/live/types";
import RollingScore from "@/components/live/RollingScore";
import BwfServiceRadar from "@/components/live/BwfServiceRadar";
import MiniRallySparkline from "@/components/live/MiniRallySparkline";

const SIDES: Side[] = ["a", "b"];

export const sideName = (m: LiveMatch, side: Side) => m.sides[side].join(" / ");

/** One court in play: players, completed games, current points, server and pressure points. */
export default function CourtCard({ court, match, href }: { court: number; match: LiveMatch | undefined; href?: string }) {
  if (!match) {
    return (
      <article aria-label={`Court ${court}, idle`} className="flex min-h-56 flex-col rounded-2xl border border-dashed border-off-white/15 p-5">
        <p className="font-display text-xs tracking-[0.18em] text-muted uppercase">Court {court}</p>
        <p className="m-auto text-sm text-muted">Between matches</p>
      </article>
    );
  }

  const current = match.games[match.games.length - 1] ?? { a: 0, b: 0 };
  const completed = match.games.filter((g) => gameWinner(g));
  const pressure = pressurePoint(match.games);
  const gameNumber = match.games.length || 1;

  return (
    <article
      aria-label={`Court ${court}: ${sideName(match, "a")} versus ${sideName(match, "b")}, game ${gameNumber}, ${current.a}–${current.b}`}
      className="group relative flex flex-col rounded-2xl border border-off-white/[0.1] bg-gradient-to-br from-black/80 via-black/70 to-court-green/[0.04] backdrop-blur-xl p-5 transition-all duration-300 hover:-translate-y-1 hover:border-court-green/60 hover:shadow-[0_12px_32px_rgba(0,0,0,0.6)] active:scale-[0.985]"
    >
      {href && (
        <Link href={href} className="absolute inset-0 z-10 focus-visible:outline-2 focus-visible:outline-court-green rounded-2xl">
          <span className="sr-only">Open court {court} scoreboard</span>
        </Link>
      )}
      <header className="flex items-center justify-between gap-3">
        <div className="flex shrink-0 items-center gap-2">
          <p className="flex shrink-0 items-center gap-2.5 font-display text-xs font-bold tracking-[0.18em] whitespace-nowrap uppercase text-off-white">
            <span aria-hidden="true" className="relative flex size-2.5 items-center justify-center">
              <span className="absolute inline-flex size-full animate-ping rounded-full bg-court-green opacity-75 motion-reduce:hidden" />
              <span className="relative inline-flex size-2 rounded-full bg-court-green shadow-[0_0_8px_rgba(16,185,129,0.9)]" />
            </span>
            Court {court}
          </p>
          {match.streamUrl && (
            <span
              title="Live Stream Broadcast Available"
              className="inline-flex items-center gap-1 rounded-full bg-red-600/20 px-2 py-0.5 font-display text-[9px] font-bold text-red-400 border border-red-500/30 uppercase tracking-[0.1em]"
            >
              <Tv className="size-2.5" />
              <span>Stream</span>
            </span>
          )}
        </div>
        <div className="flex items-center gap-2.5">
          <BwfServiceRadar
            server={match.server}
            serverScore={current[match.server]}
            compact={true}
          />
          <p className="min-w-0 truncate text-xs font-semibold tracking-[0.1em] text-muted uppercase hidden sm:block">
            {match.event} · {match.round}
          </p>
        </div>
      </header>

      <div className="mt-5 space-y-3">
        {SIDES.map((side) => {
          const serving = match.server === side;
          return (
            <div key={side} className="grid grid-cols-[1fr_auto_3.5rem] items-center gap-3">
              <p className="flex min-w-0 items-center gap-2">
                {serving ? (
                  <span
                    aria-label="Serving"
                    className="flex shrink-0 items-center gap-1 rounded bg-court-green/15 px-1.5 py-0.5 text-[9px] font-black tracking-wider text-court-green border border-court-green/40 shadow-[0_0_8px_rgba(16,185,129,0.3)]"
                  >
                    <span className="size-1.5 rounded-full bg-court-green animate-pulse" />
                    S
                  </span>
                ) : (
                  <span className="size-2 shrink-0 rounded-full bg-transparent" />
                )}
                <span className="truncate font-display font-bold uppercase">{sideName(match, side)}</span>
              </p>
              <span className="flex gap-1.5 font-display text-sm font-semibold tabular-nums text-muted">
                {completed.map((g, i) => (
                  <span key={i} className={gameWinner(g) === side ? "text-off-white font-bold" : ""}>
                    {g[side]}
                  </span>
                ))}
              </span>
              <RollingScore
                value={current[side]}
                game={gameNumber}
                className="justify-end text-right font-display text-4xl leading-none font-black tabular-nums"
              />
            </div>
          );
        })}
      </div>

      {match.history && match.history.length > 0 && (
        <div className="mt-3.5 pt-3 border-t border-off-white/10 flex items-center justify-between">
          <MiniRallySparkline history={match.history} count={8} />
          <span className="font-mono text-[9px] text-muted">
            {match.history.length} rallies
          </span>
        </div>
      )}

      <footer className="mt-auto flex items-center justify-between pt-4 text-xs tracking-[0.18em] uppercase">
        <span className="text-muted font-medium">
          Game {gameNumber} · Games {gamesWon(match.games, "a")}–{gamesWon(match.games, "b")}
        </span>
        {pressure && (
          <span className="badge-pop rounded-full bg-court-green px-3 py-0.5 font-display text-[11px] font-bold text-black shadow-[0_0_12px_rgba(16,185,129,0.4)]">
            {pressure.kind === "match" ? "Match point" : "Game point"}
          </span>
        )}
      </footer>
    </article>
  );
}
