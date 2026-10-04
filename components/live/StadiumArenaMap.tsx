"use client";

import Link from "next/link";
import { Tv, Radio, ArrowUpRight } from "lucide-react";
import type { LiveMatch } from "@/lib/live/types";
import { pressurePoint, gamesWon } from "@/lib/live/scoring";
import { sideName } from "@/components/live/CourtCard";

interface StadiumArenaMapProps {
  slug: string;
  courtsCount: number;
  matches: LiveMatch[];
}

export default function StadiumArenaMap({ slug, courtsCount, matches }: StadiumArenaMapProps) {
  const courtNumbers = Array.from({ length: courtsCount }, (_, i) => i + 1);
  const liveMatches = matches.filter((m) => m.status === "live");
  const activeCourtsCount = courtNumbers.filter((c) => liveMatches.some((m) => m.court === c)).length;
  const occupancyPercent = Math.round((activeCourtsCount / courtsCount) * 100);

  return (
    <div className="relative rounded-3xl border border-off-white/10 bg-gradient-to-b from-black/90 via-black/80 to-[#03150b]/90 p-4 sm:p-6 lg:p-8 backdrop-blur-2xl shadow-2xl overflow-hidden">
      {/* Background Architectural Grid Lines */}
      <div
        className="pointer-events-none absolute inset-0 opacity-15"
        style={{
          backgroundImage: `
            radial-gradient(circle at 50% 0%, rgba(16, 185, 129, 0.25) 0%, transparent 70%),
            linear-gradient(to right, rgba(255, 255, 255, 0.05) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(255, 255, 255, 0.05) 1px, transparent 1px)
          `,
          backgroundSize: "100% 100%, 32px 32px, 32px 32px",
        }}
      />

      {/* Arena Header & Radar Metrics */}
      <div className="relative z-10 mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-off-white/10 pb-6">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="relative flex size-3">
              <span className="absolute inline-flex size-full animate-ping rounded-full bg-court-green opacity-75" />
              <span className="relative inline-flex size-3 rounded-full bg-court-green shadow-[0_0_12px_rgba(16,185,129,0.9)]" />
            </span>
            <span className="font-display text-[11px] font-black tracking-[0.25em] text-court-green uppercase">
              Stadium Arena Radar · Live Floorplan
            </span>
          </div>
          <h3 className="mt-1 font-display text-2xl font-black tracking-tight text-off-white sm:text-3xl">
            Centre Court & Main Hall
          </h3>
          <p className="mt-1 text-xs text-muted">
            Real-time BWF court telemetry, serve positions, and live match score tracking
          </p>
        </div>

        {/* Live Arena Metrics */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 rounded-xl border border-off-white/10 bg-black/60 px-3.5 py-2 backdrop-blur-md">
            <Radio className="size-4 text-court-green animate-pulse" />
            <div className="text-left">
              <p className="text-[10px] tracking-wider text-muted uppercase font-semibold">Arena Activity</p>
              <p className="font-display text-sm font-bold text-off-white">
                {activeCourtsCount} / {courtsCount} Courts In Play ({occupancyPercent}%)
              </p>
            </div>
          </div>

          <div className="hidden sm:flex items-center gap-2 rounded-xl border border-off-white/10 bg-black/60 px-3.5 py-2 backdrop-blur-md">
            <div className="size-2 rounded-full bg-court-green shadow-[0_0_8px_rgba(16,185,129,0.9)]" />
            <div className="text-left">
              <p className="text-[10px] tracking-wider text-muted uppercase font-semibold">Umpire Terminal</p>
              <p className="font-display text-sm font-bold text-court-green">BWF Synced</p>
            </div>
          </div>
        </div>
      </div>

      {/* Stadium Arena Courts Isometric / Floorplan Layout */}
      <div className="relative z-10 grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
        {courtNumbers.map((courtNum) => {
          const match = liveMatches.find((m) => m.court === courtNum);
          return (
            <CourtFloorMat
              key={courtNum}
              courtNumber={courtNum}
              match={match}
              tournamentSlug={slug}
            />
          );
        })}
      </div>

      {/* Arena Floor Legend & Safety/Access Markers */}
      <div className="relative z-10 mt-8 flex flex-wrap items-center justify-between gap-4 border-t border-off-white/10 pt-5 text-xs text-muted">
        <div className="flex flex-wrap items-center gap-4 sm:gap-6">
          <div className="flex items-center gap-2">
            <span className="size-3 rounded-sm border border-court-green/60 bg-emerald-950/80 shadow-[0_0_8px_rgba(16,185,129,0.3)]" />
            <span>Active Rally / In-Play</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="size-3 rounded-sm border border-dashed border-off-white/20 bg-black/40" />
            <span>Court Standby</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="size-2 rounded-full bg-amber-400" />
            <span>Active Server</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="inline-block px-1 rounded bg-amber-500/20 text-[10px] font-bold text-amber-300 border border-amber-500/40">
              ⚡ Pressure Point
            </span>
          </div>
        </div>

        <p className="font-display text-[10px] tracking-widest uppercase text-muted/80">
          Official BWF 13.4m × 6.1m Mat Geometry
        </p>
      </div>
    </div>
  );
}

/** Individual regulation court mat with realistic BWF boundary lines and live player info */
function CourtFloorMat({
  courtNumber,
  match,
  tournamentSlug,
}: {
  courtNumber: number;
  match?: LiveMatch;
  tournamentSlug: string;
}) {
  const isLive = !!match;
  const current = match ? match.games[match.games.length - 1] ?? { a: 0, b: 0 } : { a: 0, b: 0 };
  const pressure = match ? pressurePoint(match.games) : null;
  const gameNumber = match ? match.games.length || 1 : 1;
  const gamesWonA = match ? gamesWon(match.games, "a") : 0;
  const gamesWonB = match ? gamesWon(match.games, "b") : 0;

  // Determine which side is serving and the court half (even: right, odd: left in BWF rules)
  const server = match?.server;
  const serverScore = server === "a" ? current.a : server === "b" ? current.b : 0;
  const isRightCourt = serverScore % 2 === 0;

  return (
    <div
      className={`group relative flex flex-col rounded-2xl border transition-all duration-300 ${
        isLive
          ? "border-court-green/40 bg-gradient-to-b from-[#06331a] via-[#042412] to-black/90 shadow-[0_12px_36px_rgba(0,0,0,0.6)] hover:border-court-green hover:shadow-[0_16px_40px_rgba(16,185,129,0.2)]"
          : "border-off-white/10 bg-black/40 hover:border-off-white/20"
      }`}
    >
      {/* Entire Card Click Target when Live */}
      {isLive && (
        <Link
          href={`/tournaments/${tournamentSlug}/live/${match.id}`}
          className="absolute inset-0 z-20 rounded-2xl focus-visible:outline-2 focus-visible:outline-court-green"
        >
          <span className="sr-only">
            View live scoreboard for Court {courtNumber}: {sideName(match, "a")} vs {sideName(match, "b")}
          </span>
        </Link>
      )}

      {/* Court Header Bar */}
      <div className="flex items-center justify-between border-b border-off-white/10 p-3.5">
        <div className="flex items-center gap-2">
          <div
            className={`flex items-center justify-center rounded-lg px-2.5 py-1 font-display text-xs font-black tracking-wider uppercase ${
              isLive
                ? "bg-court-green text-black shadow-[0_0_12px_rgba(16,185,129,0.7)]"
                : "bg-off-white/10 text-muted"
            }`}
          >
            Court {courtNumber}
          </div>
          {isLive && (
            <span className="relative flex size-2">
              <span className="absolute inline-flex size-full animate-ping rounded-full bg-court-green opacity-75" />
              <span className="relative inline-flex size-2 rounded-full bg-court-green" />
            </span>
          )}
          {match?.streamUrl && (
            <span
              title="Broadcast Feed Active"
              className="inline-flex items-center gap-1 rounded bg-red-600/20 px-1.5 py-0.5 text-[9px] font-bold text-red-400 border border-red-500/30 uppercase tracking-wider"
            >
              <Tv className="size-2.5" />
              <span>Live</span>
            </span>
          )}
        </div>

        {isLive ? (
          <div className="flex items-center gap-1 text-[11px] font-bold text-off-white/90">
            <span className="text-court-green">{match.event}</span>
            <span className="text-muted">·</span>
            <span className="text-muted">{match.round}</span>
            <ArrowUpRight className="size-3.5 text-muted transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-court-green" />
          </div>
        ) : (
          <span className="text-[11px] font-semibold text-muted uppercase tracking-wider">Standby</span>
        )}
      </div>

      {/* Visual Realistic BWF Court Mat (Top-Down Isometric View) */}
      <div className="relative p-3">
        <div
          className={`relative aspect-[3/4] w-full rounded-xl overflow-hidden border p-2 flex flex-col justify-between transition-colors ${
            isLive
              ? "bg-[#0b532e] border-emerald-400/40 shadow-inner"
              : "bg-[#0a1f14]/50 border-off-white/10 opacity-70"
          }`}
        >
          {/* Badminton Court Boundary Markings (SVG overlay for crisp BWF accuracy) */}
          <svg
            className="pointer-events-none absolute inset-0 size-full stroke-off-white/50"
            viewBox="0 0 100 134"
            fill="none"
            preserveAspectRatio="none"
            strokeWidth="0.8"
          >
            {/* Outer doubles boundary */}
            <rect x="5" y="5" width="90" height="124" stroke="rgba(255,255,255,0.7)" strokeWidth="1.2" />

            {/* Singles sidelines (inner vertical) */}
            <line x1="12" y1="5" x2="12" y2="129" stroke="rgba(255,255,255,0.45)" />
            <line x1="88" y1="5" x2="88" y2="129" stroke="rgba(255,255,255,0.45)" />

            {/* Doubles rear service lines */}
            <line x1="5" y1="12" x2="95" y2="12" stroke="rgba(255,255,255,0.45)" />
            <line x1="5" y1="122" x2="95" y2="122" stroke="rgba(255,255,255,0.45)" />

            {/* Short service lines */}
            <line x1="5" y1="52" x2="95" y2="52" stroke="rgba(255,255,255,0.6)" />
            <line x1="5" y1="82" x2="95" y2="82" stroke="rgba(255,255,255,0.6)" />

            {/* Center service lines (vertical split from short line to back line) */}
            <line x1="50" y1="5" x2="50" y2="52" stroke="rgba(255,255,255,0.45)" />
            <line x1="50" y1="82" x2="50" y2="129" stroke="rgba(255,255,255,0.45)" />

            {/* The Net (Center horizontal with checkered post marks) */}
            <line x1="2" y1="67" x2="98" y2="67" stroke="#ffffff" strokeWidth="2.2" />
            <line x1="2" y1="67" x2="98" y2="67" stroke="#10b981" strokeWidth="1.2" strokeDasharray="3 2" />
            {/* Net posts */}
            <circle cx="2" cy="67" r="2" fill="#ffffff" />
            <circle cx="98" cy="67" r="2" fill="#ffffff" />
          </svg>

          {isLive && match ? (
            <>
              {/* SIDE A (Top Half of Court) */}
              <div className="relative z-10 flex flex-col justify-between pt-1 px-1">
                <div className="flex items-start justify-between gap-1">
                  <div className="min-w-0 max-w-[70%]">
                    <p className="truncate font-display text-xs font-bold text-white drop-shadow-md">
                      {sideName(match, "a")}
                    </p>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className="text-[10px] font-semibold text-emerald-200/80">
                        {gamesWonA} {gamesWonA === 1 ? "Game" : "Games"}
                      </span>
                    </div>
                  </div>

                  {/* Score for Side A */}
                  <div className="flex items-center gap-1">
                    {server === "a" && (
                      <span
                        title={`Serving from ${isRightCourt ? "Right" : "Left"} Court`}
                        className="flex size-4 items-center justify-center rounded-full bg-amber-400 text-[10px] font-black text-black shadow-md animate-bounce"
                      >
                        🏸
                      </span>
                    )}
                    <span className="font-display text-2xl font-black tabular-nums text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
                      {current.a}
                    </span>
                  </div>
                </div>
              </div>

              {/* Court Mid-Zone / Net Status Badge */}
              <div className="relative z-10 flex items-center justify-center py-0.5">
                <div className="flex items-center gap-1.5 rounded-full bg-black/85 px-3 py-1 text-[10px] font-bold text-off-white shadow-lg backdrop-blur-md border border-off-white/20">
                  <span className="text-court-green">G{gameNumber}</span>
                  {pressure ? (
                    <span className="text-amber-300 font-extrabold flex items-center gap-1">
                      <span>•</span> {pressure.kind === "match" ? "Match Point" : "Game Point"}
                    </span>
                  ) : (
                    <span className="text-muted">• In Rally</span>
                  )}
                </div>
              </div>

              {/* SIDE B (Bottom Half of Court) */}
              <div className="relative z-10 flex flex-col justify-between pb-1 px-1">
                <div className="flex items-end justify-between gap-1">
                  <div className="min-w-0 max-w-[70%]">
                    <div className="flex items-center gap-1.5 mb-0.5">
                      <span className="text-[10px] font-semibold text-emerald-200/80">
                        {gamesWonB} {gamesWonB === 1 ? "Game" : "Games"}
                      </span>
                    </div>
                    <p className="truncate font-display text-xs font-bold text-white drop-shadow-md">
                      {sideName(match, "b")}
                    </p>
                  </div>

                  {/* Score for Side B */}
                  <div className="flex items-center gap-1">
                    {server === "b" && (
                      <span
                        title={`Serving from ${isRightCourt ? "Right" : "Left"} Court`}
                        className="flex size-4 items-center justify-center rounded-full bg-amber-400 text-[10px] font-black text-black shadow-md animate-bounce"
                      >
                        🏸
                      </span>
                    )}
                    <span className="font-display text-2xl font-black tabular-nums text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
                      {current.b}
                    </span>
                  </div>
                </div>
              </div>
            </>
          ) : (
            /* Standby Court Placeholder */
            <div className="relative z-10 m-auto flex flex-col items-center justify-center p-3 text-center">
              <span className="rounded-full bg-black/60 p-2.5 text-muted border border-off-white/10 mb-2">
                🏸
              </span>
              <p className="font-display text-xs font-bold text-off-white/70 uppercase tracking-wider">
                Court Available
              </p>
              <p className="mt-1 text-[11px] text-muted">Awaiting next match call</p>
            </div>
          )}
        </div>
      </div>

      {/* Footer Details */}
      {isLive && match && (
        <div className="flex items-center justify-between border-t border-off-white/10 bg-black/40 px-3.5 py-2.5 text-[11px] text-muted">
          <span>
            History:{" "}
            <span className="font-display font-medium text-off-white tabular-nums">
              {match.games
                .filter((g) => g.a + g.b > 0)
                .map((g) => `${g.a}-${g.b}`)
                .join(", ")}
            </span>
          </span>
          <span className="font-display font-bold text-court-green group-hover:underline">
            Watch Live →
          </span>
        </div>
      )}
    </div>
  );
}
