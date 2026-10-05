"use client";

import { useState } from "react";
import Link from "next/link";
import { LayoutGrid, Maximize2, Radio, ArrowUpRight } from "lucide-react";
import type { LiveMatch, LiveSnapshot } from "@/lib/live/types";
import { sideName } from "@/components/live/CourtCard";
import { pressurePoint, gamesWon } from "@/lib/live/scoring";
import LiveStreamPlayer from "@/components/live/LiveStreamPlayer";

interface MultiCourtBroadcastStudioProps {
  snapshot: LiveSnapshot;
  slug: string;
}

type MatrixMode = "single" | "dual" | "quad";

export default function MultiCourtBroadcastStudio({ snapshot, slug }: MultiCourtBroadcastStudioProps) {
  const [matrixMode, setMatrixMode] = useState<MatrixMode>("dual");
  const liveMatches = snapshot.matches.filter((m) => m.status === "live");
  const totalCourts = snapshot.courts || 4;

  const displayCourts = Array.from({ length: totalCourts }, (_, i) => i + 1);

  // Number of courts visible based on mode
  const visibleCourts =
    matrixMode === "single"
      ? displayCourts.slice(0, 1)
      : matrixMode === "dual"
      ? displayCourts.slice(0, 2)
      : displayCourts.slice(0, 4);

  return (
    <div className="relative rounded-3xl border border-off-white/10 bg-gradient-to-b from-black/95 via-charcoal/90 to-black/95 p-4 sm:p-6 lg:p-8 backdrop-blur-2xl shadow-2xl overflow-hidden">
      {/* Studio Header & Matrix View Switcher */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-off-white/10 pb-5 mb-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex size-2 rounded-full bg-red-500 animate-ping" />
            <span className="font-display text-[10px] font-black tracking-[0.25em] text-red-400 uppercase">
              BWF Multi-Court Broadcast Studio
            </span>
          </div>
          <h3 className="mt-1 font-display text-2xl font-black uppercase text-off-white sm:text-3xl">
            Simulcast Video Wall
          </h3>
          <p className="mt-0.5 text-xs text-muted">
            Synchronized live court telemetry and multi-feed match streaming
          </p>
        </div>

        {/* View Mode Switcher */}
        <div className="inline-flex rounded-xl border border-off-white/15 bg-black/60 p-1">
          <button
            type="button"
            onClick={() => setMatrixMode("single")}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 font-display text-xs font-bold uppercase tracking-wider transition-all ${
              matrixMode === "single"
                ? "bg-court-green text-black shadow-md"
                : "text-muted hover:text-off-white"
            }`}
          >
            <span>Single Court</span>
          </button>

          <button
            type="button"
            onClick={() => setMatrixMode("dual")}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 font-display text-xs font-bold uppercase tracking-wider transition-all ${
              matrixMode === "dual"
                ? "bg-court-green text-black shadow-md"
                : "text-muted hover:text-off-white"
            }`}
          >
            <span>Dual Split (2)</span>
          </button>

          <button
            type="button"
            onClick={() => setMatrixMode("quad")}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 font-display text-xs font-bold uppercase tracking-wider transition-all ${
              matrixMode === "quad"
                ? "bg-court-green text-black shadow-md"
                : "text-muted hover:text-off-white"
            }`}
          >
            <LayoutGrid className="size-3.5" />
            <span>Quad Matrix (4)</span>
          </button>
        </div>
      </div>

      {/* Grid of Broadcast Cells */}
      <div
        className={`grid gap-6 ${
          matrixMode === "single"
            ? "grid-cols-1"
            : matrixMode === "dual"
            ? "grid-cols-1 lg:grid-cols-2"
            : "grid-cols-1 sm:grid-cols-2 xl:grid-cols-4"
        }`}
      >
        {visibleCourts.map((courtNum) => {
          const match = liveMatches.find((m) => m.court === courtNum);
          return (
            <BroadcastCourtCell
              key={courtNum}
              courtNum={courtNum}
              match={match}
              slug={slug}
            />
          );
        })}
      </div>
    </div>
  );
}

function BroadcastCourtCell({
  courtNum,
  match,
  slug,
}: {
  courtNum: number;
  match?: LiveMatch;
  slug: string;
}) {
  const isLive = Boolean(match);
  const current = match ? match.games[match.games.length - 1] ?? { a: 0, b: 0 } : { a: 0, b: 0 };
  const pressure = match ? pressurePoint(match.games) : null;
  const gameNumber = match ? match.games.length || 1 : 1;
  const gamesWonA = match ? gamesWon(match.games, "a") : 0;
  const gamesWonB = match ? gamesWon(match.games, "b") : 0;

  return (
    <div className="relative flex flex-col rounded-2xl border border-off-white/10 bg-black/70 overflow-hidden shadow-xl transition-all hover:border-court-green/50">
      {/* Cell Header */}
      <div className="flex items-center justify-between border-b border-off-white/10 bg-black/90 px-4 py-2.5">
        <div className="flex items-center gap-2">
          <span className="rounded bg-court-green px-2 py-0.5 font-display text-[10px] font-black uppercase text-black">
            Court {courtNum}
          </span>
          {isLive && (
            <span className="flex items-center gap-1 text-[10px] font-bold uppercase text-red-400">
              <span className="size-1.5 rounded-full bg-red-500 animate-pulse" />
              <span>Live</span>
            </span>
          )}
        </div>

        {isLive && match ? (
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-medium text-muted">
              {match.event} · {match.round}
            </span>
            <Link
              href={`/tournaments/${slug}/live/${match.id}`}
              className="text-muted hover:text-court-green transition-colors"
              title="Open full scoreboard"
            >
              <Maximize2 className="size-3.5" />
            </Link>
          </div>
        ) : (
          <span className="text-[10px] font-semibold uppercase text-muted">Standby</span>
        )}
      </div>

      {/* Video Stream or Virtual Court Screen */}
      <div className="relative w-full aspect-video bg-charcoal overflow-hidden flex items-center justify-center">
        {isLive && match?.streamUrl ? (
          <LiveStreamPlayer
            streamUrl={match.streamUrl}
            court={courtNum}
            event={match.event}
            round={match.round}
            sides={match.sides}
            status={match.status}
            compact={true}
          />
        ) : isLive && match ? (
          <div className="relative flex size-full flex-col justify-between p-4 bg-gradient-to-br from-[#06331a] to-black">
            <div className="flex items-center justify-between text-xs text-off-white/80">
              <span className="font-display font-bold uppercase tracking-wider text-court-green">
                Game {gameNumber} In Progress
              </span>
              {pressure && (
                <span className="rounded bg-amber-400 px-2 py-0.5 text-[9px] font-black text-black uppercase">
                  {pressure.kind === "match" ? "Match Point" : "Game Point"}
                </span>
              )}
            </div>

            {/* Mid-Court Live Scores */}
            <div className="my-auto grid grid-cols-2 gap-4 text-center">
              <div className="rounded-xl border border-off-white/10 bg-black/40 p-2.5">
                <p className="truncate font-display text-xs font-bold text-white uppercase">
                  {sideName(match, "a")}
                </p>
                <p className="font-display text-3xl sm:text-4xl font-black text-white tabular-nums">
                  {current.a}
                </p>
                <p className="text-[10px] text-muted">{gamesWonA} {gamesWonA === 1 ? "game" : "games"}</p>
              </div>

              <div className="rounded-xl border border-off-white/10 bg-black/40 p-2.5">
                <p className="truncate font-display text-xs font-bold text-white uppercase">
                  {sideName(match, "b")}
                </p>
                <p className="font-display text-3xl sm:text-4xl font-black text-white tabular-nums">
                  {current.b}
                </p>
                <p className="text-[10px] text-muted">{gamesWonB} {gamesWonB === 1 ? "game" : "games"}</p>
              </div>
            </div>

            <div className="flex items-center justify-between text-[11px] text-muted">
              <span>Server: {match.server === "a" ? sideName(match, "a") : sideName(match, "b")}</span>
              <span className="font-mono">{match.history.length} rallies played</span>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center p-6 text-center text-muted">
            <Radio className="size-6 mb-2 opacity-40" />
            <p className="font-display text-xs font-bold uppercase tracking-wider">Court {courtNum} Idle</p>
            <p className="text-[11px] text-muted/80">Next match call pending</p>
          </div>
        )}
      </div>

      {/* Cell Footer */}
      {isLive && match && (
        <div className="flex items-center justify-between border-t border-off-white/10 bg-black/50 px-4 py-2.5 text-xs">
          <span className="text-muted">
            Scores:{" "}
            <strong className="text-off-white tabular-nums">
              {match.games.map((g) => `${g.a}–${g.b}`).join(", ")}
            </strong>
          </span>
          <Link
            href={`/tournaments/${slug}/live/${match.id}`}
            className="flex items-center gap-1 font-display text-xs font-bold uppercase text-court-green hover:underline"
          >
            <span>Scoreboard</span>
            <ArrowUpRight className="size-3.5" />
          </Link>
        </div>
      )}
    </div>
  );
}
