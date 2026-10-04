"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Maximize, Minimize, Radio, Tv, Volume2, VolumeX } from "lucide-react";
import { useLiveFeed } from "@/components/live/useLiveFeed";
import { gameWinner, gamesWon, pressurePoint } from "@/lib/live/scoring";
import type { LiveSnapshot } from "@/lib/live/types";
import { sideName } from "@/components/live/CourtCard";
import RollingScore from "@/components/live/RollingScore";

interface ArenaTvDisplayProps {
  initial: LiveSnapshot;
  tournamentName: string;
  venue: string;
  city: string;
}

function playArenaChime() {
  try {
    const AudioCtx =
      typeof window !== "undefined"
        ? window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
        : null;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
    osc.frequency.setValueAtTime(880, ctx.currentTime + 0.14); // A5
    gain.gain.setValueAtTime(0.12, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.55);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.55);
  } catch {}
}

export default function ArenaTvDisplay({ initial, tournamentName, venue, city }: ArenaTvDisplayProps) {
  const { snapshot } = useLiveFeed(initial.slug, initial);
  const [fullscreen, setFullscreen] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [timeStr, setTimeStr] = useState("");
  const [controlsVisible, setControlsVisible] = useState(true);
  const prevAnnouncement = useRef<string | null>(null);

  // Play subtle arena chime when a match is called or announcement arrives
  useEffect(() => {
    if (snapshot.activeAnnouncement && snapshot.activeAnnouncement !== prevAnnouncement.current) {
      if (soundEnabled) {
        playArenaChime();
      }
    }
    prevAnnouncement.current = snapshot.activeAnnouncement ?? null;
  }, [snapshot.activeAnnouncement, soundEnabled]);

  // Live clock
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTimeStr(now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" }));
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Auto-hide controls after 4 seconds of mouse inactivity
  useEffect(() => {
    let timer: NodeJS.Timeout;
    const handleMove = () => {
      setControlsVisible(true);
      clearTimeout(timer);
      timer = setTimeout(() => setControlsVisible(false), 4000);
    };
    window.addEventListener("mousemove", handleMove);
    return () => {
      window.removeEventListener("mousemove", handleMove);
      clearTimeout(timer);
    };
  }, []);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().then(() => setFullscreen(true)).catch(() => {});
    } else {
      document.exitFullscreen().then(() => setFullscreen(false)).catch(() => {});
    }
  };

  // Group matches by courts
  const liveMatches = useMemo(() => {
    return snapshot.matches.filter((m) => m.status === "live" && m.court !== null);
  }, [snapshot.matches]);

  const scheduledMatches = useMemo(() => {
    return snapshot.matches.filter((m) => m.status === "scheduled");
  }, [snapshot.matches]);

  // Total courts to show (default 4 if none live)
  const totalCourts = Math.max(snapshot.courts || 4, liveMatches.length);
  const courtSlots = Array.from({ length: totalCourts }, (_, i) => i + 1);

  return (
    <div className="relative flex h-screen w-screen flex-col overflow-hidden bg-black text-off-white select-none">
      {/* Top TV Broadcast Header */}
      <header className="flex h-16 shrink-0 items-center justify-between border-b border-white/10 bg-black/90 px-6 backdrop-blur-md">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2.5 rounded-full border border-red-500/40 bg-red-600/15 px-3 py-1 text-xs font-bold uppercase tracking-wider text-red-400">
            <span className="relative flex size-2.5 items-center justify-center">
              <span className="absolute inline-flex size-full animate-ping rounded-full bg-red-500 opacity-75" />
              <span className="relative inline-flex size-2 rounded-full bg-red-500" />
            </span>
            <span>STADIUM TV FEED</span>
          </div>

          <div>
            <h1 className="font-display text-lg font-black tracking-wide uppercase text-white sm:text-xl">
              {tournamentName}
            </h1>
            <p className="text-[11px] font-medium text-muted tracking-wide">
              {venue}, {city}
            </p>
          </div>
        </div>

        {/* Real-time Clock and Controls */}
        <div className="flex items-center gap-4">
          <div className="font-mono text-xl font-bold tracking-widest text-court-green">
            {timeStr}
          </div>

          {/* Quick Controls Toolbar */}
          <div
            className={`flex items-center gap-2 transition-opacity duration-300 ${
              controlsVisible ? "opacity-100" : "opacity-0 pointer-events-none"
            }`}
          >
            <button
              type="button"
              onClick={() => setSoundEnabled(!soundEnabled)}
              aria-label={soundEnabled ? "Mute audio" : "Enable audio"}
              className="rounded-xl border border-white/15 bg-white/5 p-2.5 text-muted hover:border-court-green hover:text-white transition-colors"
            >
              {soundEnabled ? <Volume2 className="size-4 text-court-green" /> : <VolumeX className="size-4" />}
            </button>

            <button
              type="button"
              onClick={toggleFullscreen}
              aria-label={fullscreen ? "Exit fullscreen" : "Enter fullscreen"}
              className="rounded-xl border border-white/15 bg-white/5 p-2.5 text-muted hover:border-court-green hover:text-white transition-colors"
            >
              {fullscreen ? <Minimize className="size-4" /> : <Maximize className="size-4" />}
            </button>

            <Link
              href={`/tournaments/${snapshot.slug}/live`}
              className="inline-flex items-center gap-1.5 rounded-xl border border-white/15 bg-white/5 px-3 py-2 font-display text-xs font-bold uppercase tracking-wider text-muted hover:border-court-green hover:text-white transition-colors"
            >
              <ArrowLeft className="size-3.5" />
              <span>Exit TV</span>
            </Link>
          </div>
        </div>
      </header>

      {/* Active Announcement Flash Banner (Paging) */}
      {snapshot.activeAnnouncement && (
        <div className="bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 py-2.5 px-6 text-center shadow-lg animate-pulse">
          <p className="font-display text-sm font-black uppercase tracking-widest text-black">
            📢 {snapshot.activeAnnouncement}
          </p>
        </div>
      )}

      {/* Main Multi-Court Split Grid (Auto-adapts to 2, 4, or 6 courts) */}
      <main className="grid flex-1 gap-4 p-4 min-h-0 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-4">
        {courtSlots.map((courtNum) => {
          const match = liveMatches.find((m) => m.court === courtNum);
          if (!match) {
            // Court on standby / waiting for next match
            const nextMatch = scheduledMatches.find((m) => m.court === courtNum) || scheduledMatches[0];
            return (
              <div
                key={courtNum}
                className="flex flex-col justify-between rounded-3xl border-2 border-white/10 bg-black/60 p-6 backdrop-blur-xl"
              >
                <div className="flex items-center justify-between border-b border-white/10 pb-3">
                  <div className="flex items-center gap-2">
                    <span className="size-2.5 rounded-full bg-muted/40" />
                    <span className="font-display text-base font-black tracking-widest uppercase text-muted">
                      COURT {courtNum}
                    </span>
                  </div>
                  <span className="rounded-lg bg-white/5 px-2.5 py-1 font-display text-[11px] font-bold uppercase tracking-wider text-muted">
                    Between Matches
                  </span>
                </div>

                <div className="text-center py-8">
                  <p className="font-display text-2xl font-bold uppercase text-muted/60">STANDBY</p>
                  {nextMatch && (
                    <div className="mt-4 rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-left">
                      <span className="font-display text-[10px] font-bold uppercase tracking-widest text-court-green">
                        Next Up on Court {courtNum}
                      </span>
                      <p className="mt-1 font-display text-sm font-bold text-white uppercase truncate">
                        {sideName(nextMatch, "a")} vs {sideName(nextMatch, "b")}
                      </p>
                      <p className="text-xs text-muted mt-0.5">{nextMatch.event} · {nextMatch.round}</p>
                    </div>
                  )}
                </div>

                <div className="border-t border-white/10 pt-3 text-center text-xs text-muted tracking-wider uppercase">
                  Arena Ready
                </div>
              </div>
            );
          }

          const current = match.games[match.games.length - 1] ?? { a: 0, b: 0 };
          const completed = match.games.filter((g) => gameWinner(g));
          const pressure = pressurePoint(match.games);
          const gameNum = match.games.length || 1;

          return (
            <div
              key={courtNum}
              className="flex flex-col justify-between rounded-3xl border-2 border-court-green/40 bg-gradient-to-b from-black/90 via-black/80 to-court-green/[0.05] p-5 shadow-2xl backdrop-blur-xl relative overflow-hidden"
            >
              {/* Live Top Header */}
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <div className="flex items-center gap-2">
                  <span className="relative flex size-2.5 items-center justify-center">
                    <span className="absolute inline-flex size-full animate-ping rounded-full bg-court-green opacity-75" />
                    <span className="relative inline-flex size-2 rounded-full bg-court-green shadow-[0_0_8px_rgba(16,185,129,0.9)]" />
                  </span>
                  <span className="font-display text-base font-black tracking-widest uppercase text-white">
                    COURT {courtNum}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  {match.streamUrl && (
                    <span className="inline-flex items-center gap-1 rounded-md bg-red-600/20 px-2 py-0.5 font-display text-[10px] font-bold text-red-400 border border-red-500/30 uppercase tracking-wider">
                      <Tv className="size-2.5" />
                      LIVE
                    </span>
                  )}
                  <span className="font-display text-xs font-bold uppercase tracking-wider text-court-green">
                    Game {gameNum}
                  </span>
                </div>
              </div>

              {/* Event / Category Label */}
              <p className="mt-2 text-xs font-semibold tracking-wider uppercase text-muted truncate">
                {match.event} · {match.round}
              </p>

              {/* Player Scores & Serving Status */}
              <div className="my-auto space-y-4 py-3">
                {(["a", "b"] as const).map((side) => {
                  const serving = match.server === side;
                  return (
                    <div
                      key={side}
                      className={`flex items-center justify-between rounded-2xl border p-3.5 transition-all ${
                        serving
                          ? "border-court-green/60 bg-court-green/10 shadow-[0_0_20px_rgba(16,185,129,0.2)]"
                          : "border-white/10 bg-white/[0.02]"
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0 pr-3">
                        {serving ? (
                          <span className="flex size-6 shrink-0 items-center justify-center rounded-lg bg-court-green text-black font-black font-display text-xs shadow-[0_0_8px_rgba(16,185,129,0.9)]">
                            S
                          </span>
                        ) : (
                          <span className="size-6 shrink-0" />
                        )}
                        <div className="min-w-0">
                          <p className="font-display text-lg font-black uppercase text-white truncate sm:text-xl">
                            {sideName(match, side)}
                          </p>
                          <div className="flex items-center gap-2 text-xs text-muted">
                            <span>Games: <strong className="text-white">{gamesWon(match.games, side)}</strong></span>
                            {completed.length > 0 && (
                              <span className="text-[11px] font-mono text-muted">
                                ({completed.map((g) => g[side]).join(", ")})
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Giant Point Numeral */}
                      <RollingScore
                        value={current[side]}
                        game={gameNum}
                        className="font-display text-5xl font-black text-white tabular-nums tracking-tighter sm:text-6xl"
                      />
                    </div>
                  );
                })}
              </div>

              {/* Footer Pressure Bar */}
              <div className="mt-2 border-t border-white/10 pt-2.5 flex items-center justify-between text-xs uppercase tracking-wider">
                <span className="text-muted font-medium">
                  {current.a % 2 === 0 ? "Right Court" : "Left Court"}
                </span>
                {pressure && (
                  <span className="rounded-full bg-court-green px-2.5 py-0.5 font-display text-[10px] font-black text-black shadow-[0_0_10px_rgba(16,185,129,0.4)] animate-pulse">
                    {pressure.kind === "match" ? "MATCH POINT" : "GAME POINT"}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </main>

      {/* Bottom Ticker: On Deck / Upcoming Queue */}
      <footer className="flex h-14 shrink-0 items-center overflow-hidden border-t border-white/10 bg-black/95 px-6">
        <div className="flex shrink-0 items-center gap-2 border-r border-white/15 pr-4 font-display text-xs font-bold tracking-widest text-court-green uppercase">
          <Radio className="size-3.5 animate-pulse text-court-green" />
          <span>ON DECK</span>
        </div>

        <div className="flex flex-1 items-center overflow-x-auto px-4 text-xs font-medium text-muted tracking-wide whitespace-nowrap [scrollbar-width:none]">
          {scheduledMatches.length > 0 ? (
            scheduledMatches.slice(0, 5).map((m, i) => (
              <span key={m.id} className="inline-flex items-center gap-2 mr-6">
                <strong className="text-white uppercase">{m.court ? `Court ${m.court}` : `Match #${i + 1}`}</strong>:{" "}
                <span className="text-off-white">{sideName(m, "a")} vs {sideName(m, "b")}</span>
                <span className="text-[11px] text-muted">({m.event})</span>
                <span className="text-white/20">·</span>
              </span>
            ))
          ) : (
            <span>All scheduled matches are currently on court. Next round starting soon.</span>
          )}
        </div>
      </footer>
    </div>
  );
}
