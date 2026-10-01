"use client";

import { useCallback, useEffect, useState, useTransition } from "react";
import { Undo2 } from "lucide-react";
import { scoreRally, undoRally } from "@/app/umpire/actions";
import { sideName } from "@/components/live/CourtCard";
import { FieldError } from "@/components/registration/FormField";
import { useLiveFeed } from "@/components/live/useLiveFeed";
import { gameWinner, gamesWon, pressurePoint, type Side } from "@/lib/live/scoring";
import type { LiveMatch, LiveSnapshot } from "@/lib/live/types";

const KEYS: Record<string, Side | "undo"> = { a: "a", b: "b", ArrowLeft: "a", ArrowRight: "b", u: "undo", Backspace: "undo" };

/**
 * Umpire scoring pad. Each tap is one rally; the server applies BWF scoring and
 * broadcasts it. Shows the server's confirmed state (feed + action results).
 */
export default function ScoringPad({ initial, matchId }: { initial: LiveSnapshot; matchId: string }) {
  const { snapshot } = useLiveFeed(initial.slug, initial);
  const [confirmed, setConfirmed] = useState<LiveMatch | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const fromFeed = snapshot.matches.find((m) => m.id === matchId);
  // Prefer whichever copy has seen more rallies (action result can beat the feed).
  const match = confirmed && (!fromFeed || confirmed.history.length > fromFeed.history.length) ? confirmed : fromFeed;

  const act = useCallback(
    (what: Side | "undo") => {
      if (pending) return;
      setError(null);
      startTransition(async () => {
        const res = what === "undo" ? await undoRally(initial.slug, matchId) : await scoreRally(initial.slug, matchId, what);
        if (res.ok) setConfirmed(res.match);
        else setError(res.error);
      });
    },
    [pending, initial.slug, matchId],
  );

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.metaKey || e.ctrlKey || e.altKey) return;
      const what = KEYS[e.key];
      if (!what) return;
      e.preventDefault();
      act(what);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [act]);

  if (!match) return <p className="text-lg">This match is no longer in the live feed.</p>;

  const finished = match.status === "finished";
  const current = match.games[match.games.length - 1] ?? { a: 0, b: 0 };
  const completed = match.games.filter((g) => gameWinner(g));
  const pressure = pressurePoint(match.games);

  return (
    <div>
      <p className="font-display text-xs tracking-[0.18em] text-muted uppercase">
        {match.court ? `Court ${match.court} · ` : ""}
        {match.event} · {match.round} · Game {match.games.length || 1} · Games {gamesWon(match.games, "a")}–{gamesWon(match.games, "b")}
      </p>

      <div className="mt-6 grid grid-cols-2 gap-3">
        {(["a", "b"] as const).map((side) => (
          <button
            key={side}
            type="button"
            onClick={() => act(side)}
            disabled={finished || pending || match.status !== "live"}
            aria-label={`Point to ${sideName(match, side)}. Current score ${current[side]}.`}
            className="flex min-h-64 flex-col items-center justify-between gap-4 rounded-2xl border border-off-white/15 bg-black/60 p-5 text-center transition-colors enabled:hover:border-court-green enabled:active:bg-court-green/15 disabled:opacity-60"
          >
            <span className="flex items-center gap-2 font-display text-sm font-semibold tracking-[0.06em] uppercase sm:text-base">
              <span aria-hidden="true" className={`size-2.5 rounded-full ${match.server === side && !finished ? "bg-court-green" : "bg-transparent"}`} />
              {sideName(match, side)}
            </span>
            <span className="font-display text-[clamp(5rem,22vw,10rem)] leading-none font-bold tabular-nums">{current[side]}</span>
            <span className="flex gap-2 font-display text-sm text-muted tabular-nums">
              {completed.map((g, i) => (
                <span key={i} className={gameWinner(g) === side ? "text-off-white" : ""}>
                  {g[side]}
                </span>
              ))}
              <kbd className="ml-2 border border-off-white/20 px-1.5 text-xs">{side === "a" ? "A" : "B"}</kbd>
            </span>
          </button>
        ))}
      </div>

      <div className="mt-5 flex flex-wrap items-center justify-between gap-4">
        <button
          type="button"
          onClick={() => act("undo")}
          disabled={pending || match.history.length === 0}
          className="rounded-lg inline-flex items-center gap-2 border border-off-white/20 px-5 py-3 font-display text-xs font-semibold tracking-[0.18em] uppercase hover:border-off-white disabled:opacity-50"
        >
          <Undo2 aria-hidden="true" className="size-4" />
          Undo last rally <kbd className="text-muted">U</kbd>
        </button>
        <p aria-live="polite" className="font-display text-sm font-semibold tracking-[0.18em] text-court-green uppercase">
          {finished && match.winner
            ? `Match complete · ${sideName(match, match.winner)} win`
            : pressure
              ? `${pressure.kind === "match" ? "Match" : "Game"} point · ${sideName(match, pressure.side)}`
              : ""}
        </p>
      </div>
      {error && (
        <div role="alert" className="mt-4">
          <FieldError message={error} />
        </div>
      )}
    </div>
  );
}
