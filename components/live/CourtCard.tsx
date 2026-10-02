import Link from "next/link";
import { gameWinner, gamesWon, pressurePoint, type Side } from "@/lib/live/scoring";
import type { LiveMatch } from "@/lib/live/types";
import RollingScore from "@/components/live/RollingScore";

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
      className="group relative flex flex-col rounded-2xl border border-off-white/10 bg-black/60 p-5 transition-colors hover:border-court-green/50"
    >
      {href && (
        <Link href={href} className="absolute inset-0 z-10 focus-visible:outline-2 focus-visible:outline-court-green">
          <span className="sr-only">Open court {court} scoreboard</span>
        </Link>
      )}
      <header className="flex items-center justify-between gap-3">
        <p className="flex shrink-0 items-center gap-2 font-display text-xs tracking-[0.18em] whitespace-nowrap uppercase">
          <span aria-hidden="true" className="size-1.5 animate-pulse rounded-full bg-court-green motion-reduce:animate-none" />
          Court {court}
        </p>
        <p className="min-w-0 truncate text-xs tracking-[0.08em] text-muted uppercase">
          {match.event} · {match.round}
        </p>
      </header>

      <div className="mt-5 space-y-3">
        {SIDES.map((side) => {
          const serving = match.server === side;
          return (
            <div key={side} className="grid grid-cols-[1fr_auto_3.5rem] items-center gap-3">
              <p className="flex min-w-0 items-center gap-2">
                <span
                  aria-label={serving ? "Serving" : undefined}
                  className={`size-2 shrink-0 rounded-full transition-colors duration-300 ${serving ? "bg-court-green" : "bg-transparent"}`}
                />
                <span className="truncate font-display font-semibold uppercase">{sideName(match, side)}</span>
              </p>
              <span className="flex gap-1.5 font-display text-sm tabular-nums text-muted">
                {completed.map((g, i) => (
                  <span key={i} className={gameWinner(g) === side ? "text-off-white" : ""}>
                    {g[side]}
                  </span>
                ))}
              </span>
              <RollingScore
                value={current[side]}
                game={gameNumber}
                className="justify-end text-right font-display text-4xl leading-none font-bold tabular-nums"
              />
            </div>
          );
        })}
      </div>

      <footer className="mt-auto flex items-center justify-between pt-5 text-xs tracking-[0.18em] uppercase">
        <span className="text-muted">
          Game {gameNumber} · Games {gamesWon(match.games, "a")}–{gamesWon(match.games, "b")}
        </span>
        {pressure && (
          <span className="badge-pop rounded-lg bg-court-green px-2 py-0.5 font-display font-semibold text-black">
            {pressure.kind === "match" ? "Match point" : "Game point"}
          </span>
        )}
      </footer>
    </article>
  );
}
