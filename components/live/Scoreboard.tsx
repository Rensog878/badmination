"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { Activity, Expand, Minimize, Trophy } from "lucide-react";
import { sideName } from "@/components/live/CourtCard";
import { useLiveFeed } from "@/components/live/useLiveFeed";
import { gameWinner, gamesWon, pressurePoint, type Side } from "@/lib/live/scoring";
import type { LiveMatch, LiveSnapshot } from "@/lib/live/types";
import RollingScore from "@/components/live/RollingScore";
import LiveStreamPlayer from "@/components/live/LiveStreamPlayer";
import MatchWinnerCardModal from "@/components/live/MatchWinnerCardModal";
import MatchAnalytics from "@/components/live/MatchAnalytics";

const SIDES: Side[] = ["a", "b"];

/** Rallies of the game in progress (each rally adds exactly one point). */
export const currentGameRallies = (m: LiveMatch) => {
  const g = m.games[m.games.length - 1];
  const n = g ? g.a + g.b : 0;
  return n ? m.history.slice(-n) : [];
};

const noopSubscribe = () => () => {};
/** iPhone Safari can't fullscreen arbitrary elements; only offer the button where it works. */
const useFullscreenSupported = () =>
  useSyncExternalStore(noopSubscribe, () => Boolean(document.fullscreenEnabled), () => false);

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
  const [activeMatchId, setActiveMatchId] = useState(matchId);
  const match = snapshot.matches.find((m) => m.id === activeMatchId) ?? snapshot.matches.find((m) => m.id === matchId);
  const liveMatches = snapshot.matches.filter((m) => m.status === "live");
  const frame = useRef<HTMLDivElement>(null);
  const [fullscreen, setFullscreen] = useState(false);
  const [showVictoryModal, setShowVictoryModal] = useState(false);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const now = useNow();
  const canFullscreen = useFullscreenSupported();

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

        {/* Top-Platform Live Court Quick Switcher */}
        {liveMatches.length > 1 && !fullscreen && (
          <nav aria-label="Switch court" className="mb-6 flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
            <span className="font-display text-[10px] font-bold tracking-[0.16em] uppercase text-muted shrink-0 mr-1">
              Live Courts:
            </span>
            {liveMatches.map((m) => {
              const isActive = m.id === match?.id;
              const curScore = m.games[m.games.length - 1] ?? { a: 0, b: 0 };
              const sideASurname = m.sides.a[0]?.split(" ").pop() ?? "A";
              const sideBSurname = m.sides.b[0]?.split(" ").pop() ?? "B";
              return (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => {
                    setActiveMatchId(m.id);
                    if (typeof window !== "undefined") {
                      window.history.replaceState(null, "", `/tournaments/${snapshot.slug}/live/${m.id}`);
                    }
                  }}
                  className={`group flex items-center gap-2 rounded-xl px-3.5 py-2 font-display text-xs font-bold uppercase transition-all shrink-0 ${
                    isActive
                      ? "bg-court-green text-black shadow-[0_0_12px_rgba(16,185,129,0.4)]"
                      : "border border-off-white/10 bg-off-white/5 text-muted hover:border-court-green/40 hover:bg-off-white/10 hover:text-off-white"
                  }`}
                >
                  <span
                    className={`size-2 rounded-full ${
                      isActive ? "bg-black" : "bg-court-green animate-pulse"
                    }`}
                  />
                  <span>Court {m.court ?? 1}</span>
                  <span className={`text-[10px] font-medium opacity-80 ${isActive ? "text-black" : "text-off-white"}`}>
                    {sideASurname} {curScore.a}–{curScore.b} {sideBSurname}
                  </span>
                </button>
              );
            })}
          </nav>
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
            {canFullscreen && (
              <button
                type="button"
                onClick={toggleFullscreen}
                aria-label={fullscreen ? "Exit full screen" : "Full screen"}
                className="inline-flex size-11 items-center justify-center rounded-lg border border-off-white/15 hover:border-court-green hover:text-court-green"
              >
                {fullscreen ? <Minimize aria-hidden="true" className="size-4" /> : <Expand aria-hidden="true" className="size-4" />}
              </button>
            )}
          </div>
        </header>

        {/* Live Court Stream or Match Highlight Video Player */}
        {match.streamUrl && !fullscreen && (
          <div className="pt-6">
            <LiveStreamPlayer
              key={match.id}
              streamUrl={match.streamUrl}
              court={match.court}
              event={match.event}
              round={match.round}
              status={match.status}
              sides={match.sides}
            />
          </div>
        )}

        {/* Visual scoreboard; the sr-only summary below carries the same information. */}
        <div aria-hidden="true" className="divide-y divide-off-white/10">
          {SIDES.map((side) => {
            const won = finished && match.winner === side;
            const serving = !finished && match.server === side;
            return (
              <div key={side} className="grid grid-cols-[1fr_auto] items-center gap-4 py-6 sm:grid-cols-[1fr_auto_auto] sm:gap-8 sm:py-8">
                <div className="flex min-w-0 items-center gap-3 sm:gap-4">
                  <span className={`size-3 shrink-0 rounded-full transition-colors duration-300 sm:size-4 ${serving ? "bg-court-green" : "bg-transparent"}`} />
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
                  <RollingScore
                    value={current[side]}
                    game={match.games.length}
                    className="min-w-[2ch] justify-end text-right font-display text-[clamp(4rem,13vw,12rem)] leading-[0.85] font-bold tabular-nums"
                  />
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
          <div className="flex flex-wrap items-center gap-3">
            <div aria-hidden="true" className="flex flex-wrap items-center gap-1" title="Rallies this game">
              {rallies.map((r, i) => (
                <span key={i} className={`rally-in h-4 w-1.5 ${r.side === "a" ? "-translate-y-1 bg-court-green" : "translate-y-1 bg-off-white/50"}`} />
              ))}
            </div>
            <button
              type="button"
              onClick={() => setShowAnalytics(!showAnalytics)}
              className="inline-flex items-center gap-1.5 rounded-lg border border-off-white/10 bg-off-white/5 px-2.5 py-1 text-[11px] font-bold uppercase tracking-[0.1em] text-muted hover:border-court-green/40 hover:text-court-green transition-colors"
            >
              <Activity className="size-3 text-court-green" />
              <span>{showAnalytics ? "Hide Stats" : "Match Stats"}</span>
            </button>
          </div>
          {pressure && !finished && (
            <p key={`${pressure.kind}-${pressure.side}`} className="badge-pop rounded-lg bg-court-green px-3 py-1 font-display text-sm font-semibold tracking-[0.2em] text-black uppercase">
              {pressure.kind === "match" ? "Match point" : "Game point"} · {sideName(match, pressure.side)}
            </p>
          )}
          {finished && (
            <div className="flex flex-wrap items-center gap-3">
              {match.winner && (
                <p className="font-display text-sm font-semibold tracking-[0.2em] text-court-green uppercase">
                  {sideName(match, match.winner)} win
                </p>
              )}
              <button
                type="button"
                onClick={() => setShowVictoryModal(true)}
                className="inline-flex min-h-10 items-center gap-1.5 rounded-xl bg-court-green px-3.5 py-1.5 font-display text-xs font-bold tracking-[0.14em] text-black uppercase hover:bg-off-white transition-all shadow-[0_0_12px_rgba(16,185,129,0.3)]"
              >
                <Trophy className="size-3.5" />
                <span>Share Story Card</span>
              </button>
            </div>
          )}
        </footer>

        {/* BWF Match Analytics & Momentum Drawer */}
        {showAnalytics && !fullscreen && (
          <MatchAnalytics match={match} />
        )}

        <p className="sr-only" aria-live="polite">
          {finished && match.winner
            ? `Final. ${sideName(match, match.winner)} won, ${match.games.map((g) => `${g.a}–${g.b}`).join(", ")}.`
            : `${sideName(match, "a")} ${current.a}, ${sideName(match, "b")} ${current.b}. ${statusLabel}. Games ${gamesWon(match.games, "a")}–${gamesWon(match.games, "b")}.${
                pressure ? ` ${pressure.kind === "match" ? "Match" : "Game"} point ${sideName(match, pressure.side)}.` : ""
              }`}
        </p>

        {showVictoryModal && (
          <MatchWinnerCardModal
            match={match}
            tournamentSlug={initial.slug}
            tournamentName={initial.slug.replace(/-/g, " ")}
            onClose={() => setShowVictoryModal(false)}
          />
        )}
      </div>
    </div>
  );
}
