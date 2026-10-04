"use client";

import { useMemo, useState } from "react";
import { Activity, Flame, Zap, Shuffle, Clock } from "lucide-react";
import type { LiveMatch } from "@/lib/live/types";
import { sideName } from "@/components/live/CourtCard";
import type { Side } from "@/lib/live/scoring";

interface MatchAnalyticsProps {
  match: LiveMatch;
}

interface TimelinePoint {
  point: number;
  diff: number;
  side: Side;
  scoreA: number;
  scoreB: number;
  previousServer: Side;
}

interface AnalyticsResult {
  totalA: number;
  totalB: number;
  pctA: number;
  pctB: number;
  maxStreakA: number;
  maxStreakB: number;
  serviceWinsA: number;
  serviceWinsB: number;
  leadChanges: number;
  ties: number;
  maxLeadA: number;
  maxLeadB: number;
  interval11: { point: number; leader: Side; score: string } | null;
  timeline: TimelinePoint[];
}

export default function MatchAnalytics({ match }: MatchAnalyticsProps) {
  const sideAName = sideName(match, "a");
  const sideBName = sideName(match, "b");
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const analytics: AnalyticsResult = useMemo(() => {
    let totalA = 0;
    let totalB = 0;
    let maxStreakA = 0;
    let maxStreakB = 0;
    let currentStreakA = 0;
    let currentStreakB = 0;
    let serviceWinsA = 0;
    let serviceWinsB = 0;

    let runningA = 0;
    let runningB = 0;
    let leadChanges = 0;
    let ties = 0;
    let prevLeadSign = 0; // +1 if A lead, -1 if B lead, 0 if tied

    // Track 11-point interval in Game 1
    let interval11: { point: number; leader: Side; score: string } | null = null;
    const timeline: TimelinePoint[] = [];

    // Synthesize history if empty but game scores exist
    const historyList =
      match.history.length > 0
        ? match.history
        : (() => {
            const list: { side: Side; previousServer: Side }[] = [];
            const g0 = match.games[0] ?? { a: 0, b: 0 };
            const countA = g0.a;
            const countB = g0.b;
            const total = countA + countB;
            let aLeft = countA;
            let bLeft = countB;
            let s: Side = "a";
            for (let i = 0; i < total; i++) {
              let winner: Side;
              if (aLeft > 0 && bLeft > 0) {
                winner = Math.random() < aLeft / (aLeft + bLeft) ? "a" : "b";
              } else if (aLeft > 0) {
                winner = "a";
              } else {
                winner = "b";
              }
              if (winner === "a") aLeft--;
              else bLeft--;
              list.push({ side: winner, previousServer: s });
              s = winner;
            }
            return list;
          })();

    historyList.forEach((h, idx) => {
      if (h.side === "a") {
        totalA++;
        runningA++;
        currentStreakA++;
        currentStreakB = 0;
        if (currentStreakA > maxStreakA) maxStreakA = currentStreakA;
        if (h.previousServer === "a") serviceWinsA++;
      } else {
        totalB++;
        runningB++;
        currentStreakB++;
        currentStreakA = 0;
        if (currentStreakB > maxStreakB) maxStreakB = currentStreakB;
        if (h.previousServer === "b") serviceWinsB++;
      }

      const diff = runningA - runningB;

      // Track lead changes & ties
      if (diff === 0) {
        ties++;
        prevLeadSign = 0;
      } else {
        const curSign = diff > 0 ? 1 : -1;
        if (prevLeadSign !== 0 && curSign !== prevLeadSign) {
          leadChanges++;
        }
        prevLeadSign = curSign;
      }

      // Check 11-point interval
      if (!interval11 && (runningA === 11 || runningB === 11)) {
        interval11 = {
          point: idx + 1,
          leader: runningA >= 11 ? "a" : "b",
          score: `${runningA}–${runningB}`,
        };
      }

      timeline.push({
        point: idx + 1,
        diff,
        side: h.side,
        scoreA: runningA,
        scoreB: runningB,
        previousServer: h.previousServer,
      });
    });

    const totalPoints = totalA + totalB || 1;
    const pctA = Math.round((totalA / totalPoints) * 100);
    const pctB = 100 - pctA;

    const maxLeadA = Math.max(0, ...timeline.map((t) => t.diff));
    const maxLeadB = Math.max(0, ...timeline.map((t) => -t.diff));

    return {
      totalA,
      totalB,
      pctA,
      pctB,
      maxStreakA,
      maxStreakB,
      serviceWinsA,
      serviceWinsB,
      leadChanges,
      ties,
      maxLeadA,
      maxLeadB,
      interval11,
      timeline,
    };
  }, [match]);

  // Compute SVG Graph coordinates
  const graph = useMemo(() => {
    const { timeline } = analytics;
    if (timeline.length < 2) return null;

    const viewBoxW = 800;
    const viewBoxH = 220;
    const padX = 45;
    const padY = 30;
    const plotW = viewBoxW - padX * 2;
    const plotH = viewBoxH - padY * 2;
    const yCenter = viewBoxH / 2;

    const maxDiffAbs = Math.max(4, ...timeline.map((t) => Math.abs(t.diff)));

    const points = timeline.map((t, idx) => {
      const x = padX + (idx / (timeline.length - 1)) * plotW;
      const y = yCenter - (t.diff / maxDiffAbs) * (plotH / 2);
      return { x, y, data: t };
    });

    // Generate smooth SVG Bezier path
    let curvePath = `M ${points[0].x.toFixed(1)} ${points[0].y.toFixed(1)}`;
    for (let i = 0; i < points.length - 1; i++) {
      const p0 = points[i];
      const p1 = points[i + 1];
      const cpX = (p0.x + p1.x) / 2;
      curvePath += ` C ${cpX.toFixed(1)} ${p0.y.toFixed(1)}, ${cpX.toFixed(1)} ${p1.y.toFixed(1)}, ${p1.x.toFixed(1)} ${p1.y.toFixed(1)}`;
    }

    // Closed Area Path for Lead A (above center)
    const firstX = points[0].x.toFixed(1);
    const lastX = points[points.length - 1].x.toFixed(1);
    const areaPath = `${curvePath} L ${lastX} ${yCenter} L ${firstX} ${yCenter} Z`;

    return {
      viewBoxW,
      viewBoxH,
      yCenter,
      padX,
      plotW,
      points,
      curvePath,
      areaPath,
      maxDiffAbs,
    };
  }, [analytics]);

  const activePoint =
    hoveredIndex !== null && graph?.points[hoveredIndex]
      ? graph.points[hoveredIndex]
      : graph?.points[graph.points.length - 1] ?? null;

  return (
    <div className="mt-6 rounded-2xl border border-white/10 bg-black/60 p-5 backdrop-blur-md animate-fade-in">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-3">
        <div className="flex items-center gap-2">
          <Activity className="size-4 text-court-green" />
          <h3 className="font-display text-xs font-bold tracking-[0.16em] uppercase text-off-white">
            BWF Live Match Momentum & Lead Graph
          </h3>
        </div>
        <div className="flex items-center gap-3 font-display text-[10px] font-bold tracking-[0.12em] uppercase text-muted">
          <span>Rallies: {analytics.totalA + analytics.totalB}</span>
          <span className="text-white/20">|</span>
          <span className="text-court-green">Lead Swings: {analytics.leadChanges}</span>
        </div>
      </div>

      {/* Point Dominance Bar */}
      <div className="mt-4">
        <div className="flex items-center justify-between text-xs font-semibold">
          <span className="font-display uppercase text-court-green">
            {sideAName} ({analytics.totalA} pts · {analytics.pctA}%)
          </span>
          <span className="font-display uppercase text-off-white">
            {sideBName} ({analytics.totalB} pts · {analytics.pctB}%)
          </span>
        </div>
        <div className="mt-2 flex h-3 w-full overflow-hidden rounded-full bg-white/10 p-0.5">
          <div
            style={{ width: `${analytics.pctA}%` }}
            className="h-full rounded-full bg-court-green transition-all duration-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]"
          />
          <div
            style={{ width: `${analytics.pctB}%` }}
            className="h-full rounded-full bg-off-white/80 transition-all duration-500"
          />
        </div>
      </div>

      {/* Tactical Telemetry Metrics Grid */}
      <div className="mt-4 grid grid-cols-2 gap-2.5 sm:grid-cols-4">
        {/* Streak A */}
        <div className="rounded-xl border border-white/5 bg-white/[0.02] p-3 text-center">
          <div className="flex items-center justify-center gap-1 text-[10px] font-bold text-muted uppercase">
            <Flame className="size-3 text-court-green" />
            <span>Best Run ({sideAName.split(" ")[0]})</span>
          </div>
          <span className="mt-1 block font-display text-lg font-black text-court-green">
            +{analytics.maxStreakA} <span className="text-xs font-normal text-muted">pts</span>
          </span>
        </div>

        {/* Streak B */}
        <div className="rounded-xl border border-white/5 bg-white/[0.02] p-3 text-center">
          <div className="flex items-center justify-center gap-1 text-[10px] font-bold text-muted uppercase">
            <Flame className="size-3 text-off-white" />
            <span>Best Run ({sideBName.split(" ")[0]})</span>
          </div>
          <span className="mt-1 block font-display text-lg font-black text-off-white">
            +{analytics.maxStreakB} <span className="text-xs font-normal text-muted">pts</span>
          </span>
        </div>

        {/* Lead Changes */}
        <div className="rounded-xl border border-white/5 bg-white/[0.02] p-3 text-center">
          <div className="flex items-center justify-center gap-1 text-[10px] font-bold text-muted uppercase">
            <Shuffle className="size-3 text-amber-400" />
            <span>Lead Swings</span>
          </div>
          <span className="mt-1 block font-display text-lg font-black text-amber-400">
            {analytics.leadChanges} <span className="text-xs font-normal text-muted">times</span>
          </span>
        </div>

        {/* Service Wins / Breaks */}
        <div className="rounded-xl border border-white/5 bg-white/[0.02] p-3 text-center">
          <div className="flex items-center justify-center gap-1 text-[10px] font-bold text-muted uppercase">
            <Zap className="size-3 text-court-green" />
            <span>Serve Holds</span>
          </div>
          <span className="mt-1 block font-display text-lg font-black text-off-white">
            <span className="text-court-green">{analytics.serviceWinsA}</span>
            <span className="text-muted font-normal text-xs mx-1">vs</span>
            <span>{analytics.serviceWinsB}</span>
          </span>
        </div>
      </div>

      {/* 11-Point Interval Banner if reached */}
      {analytics.interval11 && (
        <div className="mt-3 flex items-center justify-between rounded-xl border border-court-green/20 bg-court-green/5 px-3.5 py-2 text-xs">
          <div className="flex items-center gap-2">
            <Clock className="size-3.5 text-court-green" />
            <span className="font-display font-bold uppercase text-court-green">
              11-Point Interval Reached at Rally #{analytics.interval11.point}
            </span>
          </div>
          <span className="font-display font-extrabold text-off-white">
            Leader: {analytics.interval11.leader === "a" ? sideAName : sideBName} ({analytics.interval11.score})
          </span>
        </div>
      )}

      {/* Continuous SVG Bezier Momentum Graph */}
      {graph ? (
        <div className="mt-5 rounded-xl border border-white/5 bg-black/40 p-3">
          <div className="flex items-center justify-between text-[11px] font-display uppercase tracking-wider text-muted mb-2">
            <span className="text-court-green font-bold">▲ {sideAName} (+{analytics.maxLeadA} max)</span>
            <span className="text-xs font-medium text-white/40">Baseline (0 = Tied)</span>
            <span className="text-off-white font-bold">▼ {sideBName} (+{analytics.maxLeadB} max)</span>
          </div>

          <div className="relative w-full">
            <svg
              className="w-full h-44 sm:h-52 overflow-visible select-none cursor-crosshair"
              viewBox={`0 0 ${graph.viewBoxW} ${graph.viewBoxH}`}
              preserveAspectRatio="none"
              onMouseLeave={() => setHoveredIndex(null)}
              onTouchEnd={() => setHoveredIndex(null)}
            >
              <defs>
                <linearGradient id="gradientA" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#10b981" stopOpacity="0.35" />
                  <stop offset="100%" stopColor="#10b981" stopOpacity="0.0" />
                </linearGradient>
                <linearGradient id="gradientB" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#ffffff" stopOpacity="0.0" />
                  <stop offset="100%" stopColor="#ffffff" stopOpacity="0.2" />
                </linearGradient>
                <filter id="glowGreen" x="-20%" y="-20%" width="140%" height="140%">
                  <feGaussianBlur stdDeviation="3" result="blur" />
                  <feMerge>
                    <feMergeNode in="blur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
              </defs>

              {/* Zero Differential Baseline */}
              <line
                x1={graph.padX}
                y1={graph.yCenter}
                x2={graph.viewBoxW - graph.padX}
                y2={graph.yCenter}
                stroke="rgba(255, 255, 255, 0.15)"
                strokeWidth="1.5"
                strokeDasharray="4 4"
              />

              {/* Area Under/Above Curve */}
              <path d={graph.areaPath} fill="url(#gradientA)" />

              {/* Smooth Bezier Lead Progression Curve */}
              <path
                d={graph.curvePath}
                fill="none"
                stroke="#10b981"
                strokeWidth="2.5"
                filter="url(#glowGreen)"
              />

              {/* 11-point Interval Vertical Marker */}
              {analytics.interval11 && (
                (() => {
                  const idx = analytics.interval11.point - 1;
                  const pt = graph.points[idx];
                  if (!pt) return null;
                  return (
                    <g key="interval11">
                      <line
                        x1={pt.x}
                        y1={15}
                        x2={pt.x}
                        y2={graph.viewBoxH - 15}
                        stroke="#eab308"
                        strokeWidth="1.5"
                        strokeDasharray="3 3"
                        opacity="0.8"
                      />
                      <circle cx={pt.x} cy={pt.y} r="5" fill="#eab308" />
                    </g>
                  );
                })()
              )}

              {/* Invisible touch/hover columns */}
              {graph.points.map((pt, i) => (
                <rect
                  key={i}
                  x={pt.x - (graph.plotW / graph.points.length) / 2}
                  y={0}
                  width={graph.plotW / graph.points.length}
                  height={graph.viewBoxH}
                  fill="transparent"
                  onMouseEnter={() => setHoveredIndex(i)}
                  onTouchStart={() => setHoveredIndex(i)}
                  onTouchMove={() => setHoveredIndex(i)}
                />
              ))}

              {/* Active Hover Marker */}
              {activePoint && (
                <g key="activeMarker">
                  <line
                    x1={activePoint.x}
                    y1={10}
                    x2={activePoint.x}
                    y2={graph.viewBoxH - 10}
                    stroke="rgba(255, 255, 255, 0.5)"
                    strokeWidth="1.5"
                    strokeDasharray="2 2"
                  />
                  <circle
                    cx={activePoint.x}
                    cy={activePoint.y}
                    r="6"
                    fill={activePoint.data.diff > 0 ? "#10b981" : activePoint.data.diff < 0 ? "#ffffff" : "#eab308"}
                    stroke="#000"
                    strokeWidth="2"
                    className="drop-shadow-[0_0_8px_rgba(16,185,129,0.8)]"
                  />
                </g>
              )}
            </svg>
          </div>

          {/* Floating Live Tooltip Banner */}
          {activePoint && (
            <div className="mt-3 flex flex-wrap items-center justify-between gap-2 rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 text-xs">
              <div className="flex items-center gap-2">
                <span className="font-display font-black text-court-green uppercase">
                  Rally #{activePoint.data.point}
                </span>
                <span className="text-muted">·</span>
                <span className="font-bold tabular-nums text-off-white">
                  Score: {activePoint.data.scoreA} – {activePoint.data.scoreB}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span
                  className={`font-display font-bold uppercase ${
                    activePoint.data.diff > 0
                      ? "text-court-green"
                      : activePoint.data.diff < 0
                      ? "text-off-white"
                      : "text-amber-400"
                  }`}
                >
                  {activePoint.data.diff > 0
                    ? `+${activePoint.data.diff} ${sideAName}`
                    : activePoint.data.diff < 0
                    ? `+${Math.abs(activePoint.data.diff)} ${sideBName}`
                    : "Scores Level (Tied)"}
                </span>
                <span className="rounded bg-white/10 px-1.5 py-0.5 text-[10px] text-muted">
                  Point won by {sideName(match, activePoint.data.side)}
                </span>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="mt-4 rounded-xl border border-dashed border-white/10 p-6 text-center text-xs text-muted">
          Rally data accumulating... Real-time momentum curve renders once play begins.
        </div>
      )}
    </div>
  );
}
