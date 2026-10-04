"use client";

import { useMemo, useState } from "react";
import { Activity, Info } from "lucide-react";
import type { LiveMatch } from "@/lib/live/types";
import { sideName } from "@/components/live/CourtCard";
import type { Side } from "@/lib/live/scoring";

interface MomentumWaveformChartProps {
  match: LiveMatch;
  compact?: boolean;
}

interface RallyPoint {
  index: number;
  rallyNum: number;
  gameIndex: number;
  winner: Side;
  previousServer: Side;
  scoreA: number;
  scoreB: number;
  diff: number; // positive = A lead, negative = B lead
  isInterval?: boolean;
  isGamePoint?: boolean;
  isMatchPoint?: boolean;
  isLeadChange?: boolean;
}

export default function MomentumWaveformChart({ match, compact = false }: MomentumWaveformChartProps) {
  const sideAName = sideName(match, "a");
  const sideBName = sideName(match, "b");

  // Game selection: -1 for All Games, 0 for G1, 1 for G2, 2 for G3
  const availableGames = match.games.length;
  const [selectedGame, setSelectedGame] = useState<number>(-1);
  const [hoveredPoint, setHoveredPoint] = useState<RallyPoint | null>(null);

  // Compute rally points with momentum differential
  const { allRallies, gameRallies } = useMemo(() => {
    const list: RallyPoint[] = [];

    // Synthesize history if empty
    const sourceHistory =
      match.history.length > 0
        ? match.history
        : (() => {
            const synth: { side: Side; previousServer: Side }[] = [];
            match.games.forEach((g) => {
              let a = g.a;
              let b = g.b;
              let s: Side = "a";
              const total = a + b;
              for (let i = 0; i < total; i++) {
                let win: Side;
                if (a > 0 && b > 0) win = Math.random() < a / (a + b) ? "a" : "b";
                else if (a > 0) win = "a";
                else win = "b";
                if (win === "a") a--;
                else b--;
                synth.push({ side: win, previousServer: s });
                s = win;
              }
            });
            return synth;
          })();

    let runningA = 0;
    let runningB = 0;
    let currentGame = 0;
    let gameScoreA = 0;
    let gameScoreB = 0;
    let prevLeadSign = 0;
    let intervalHitThisGame = false;

    sourceHistory.forEach((h, i) => {
      if (h.side === "a") {
        runningA++;
        gameScoreA++;
      } else {
        runningB++;
        gameScoreB++;
      }

      const diff = runningA - runningB;
      const leadSign = diff > 0 ? 1 : diff < 0 ? -1 : 0;
      const isLeadChange = prevLeadSign !== 0 && leadSign !== 0 && prevLeadSign !== leadSign;
      prevLeadSign = leadSign;

      let isInterval = false;
      if (!intervalHitThisGame && (gameScoreA >= 11 || gameScoreB >= 11)) {
        isInterval = true;
        intervalHitThisGame = true;
      }

      const isGamePoint =
        (gameScoreA >= 20 || gameScoreB >= 20) && Math.abs(gameScoreA - gameScoreB) >= 1;
      const isMatchPoint =
        isGamePoint &&
        ((currentGame === 1 && ((runningA > runningB && match.games[0]?.a > match.games[0]?.b) || (runningB > runningA && match.games[0]?.b > match.games[0]?.a))) ||
          currentGame >= 2);

      list.push({
        index: i,
        rallyNum: i + 1,
        gameIndex: currentGame,
        winner: h.side,
        previousServer: h.previousServer,
        scoreA: gameScoreA,
        scoreB: gameScoreB,
        diff,
        isInterval,
        isGamePoint,
        isMatchPoint,
        isLeadChange,
      });

      // Check for BWF game conclusion (21+ with 2-point lead or 30 cap)
      if (
        (gameScoreA >= 21 && gameScoreA - gameScoreB >= 2) ||
        (gameScoreB >= 21 && gameScoreB - gameScoreA >= 2) ||
        gameScoreA === 30 ||
        gameScoreB === 30
      ) {
        currentGame++;
        gameScoreA = 0;
        gameScoreB = 0;
        intervalHitThisGame = false;
      }
    });

    return {
      allRallies: list,
      gameRallies: (gIdx: number) => list.filter((r) => r.gameIndex === gIdx),
    };
  }, [match]);

  const activePoints = useMemo(() => {
    if (selectedGame === -1) return allRallies;
    return gameRallies(selectedGame);
  }, [selectedGame, allRallies, gameRallies]);

  // Compute SVG dimensions and paths
  const svgData = useMemo(() => {
    if (activePoints.length === 0) return null;

    const viewBoxW = 800;
    const viewBoxH = compact ? 160 : 220;
    const padX = 40;
    const padY = 24;
    const plotW = viewBoxW - padX * 2;
    const plotH = viewBoxH - padY * 2;
    const yCenter = padY + plotH / 2;

    const maxDiffAbs = Math.max(3, ...activePoints.map((p) => Math.abs(p.diff)));
    const scaleY = (plotH / 2) / maxDiffAbs;

    const mapped = activePoints.map((pt, i) => {
      const x = padX + (i / Math.max(1, activePoints.length - 1)) * plotW;
      // Invert: positive diff (Side A lead) goes UP (smaller Y in SVG)
      const y = yCenter - pt.diff * scaleY;
      return { ...pt, x, y };
    });

    // Catmull-Rom or smooth Bezier path
    let curvePath = `M ${mapped[0].x.toFixed(1)} ${mapped[0].y.toFixed(1)}`;
    for (let i = 0; i < mapped.length - 1; i++) {
      const p0 = mapped[Math.max(0, i - 1)];
      const p1 = mapped[i];
      const p2 = mapped[i + 1];
      const p3 = mapped[Math.min(mapped.length - 1, i + 2)];

      const cp1x = p1.x + (p2.x - p0.x) / 6;
      const cp1y = p1.y + (p2.y - p0.y) / 6;
      const cp2x = p2.x - (p3.x - p1.x) / 6;
      const cp2y = p2.y - (p3.y - p1.y) / 6;

      curvePath += ` C ${cp1x.toFixed(1)} ${cp1y.toFixed(1)}, ${cp2x.toFixed(1)} ${cp2y.toFixed(1)}, ${p2.x.toFixed(1)} ${p2.y.toFixed(1)}`;
    }

    const firstX = mapped[0].x.toFixed(1);
    const lastX = mapped[mapped.length - 1].x.toFixed(1);

    // Area path closed against the yCenter (zero baseline)
    const areaPath = `${curvePath} L ${lastX} ${yCenter} L ${firstX} ${yCenter} Z`;

    return {
      viewBoxW,
      viewBoxH,
      padX,
      plotW,
      yCenter,
      mapped,
      curvePath,
      areaPath,
      maxDiffAbs,
    };
  }, [activePoints, compact]);

  const activeRally = hoveredPoint || (activePoints.length > 0 ? activePoints[activePoints.length - 1] : null);

  return (
    <div className="relative rounded-2xl border border-off-white/10 bg-gradient-to-b from-black/80 via-black/70 to-court-green/[0.03] p-4 sm:p-6 backdrop-blur-xl shadow-xl">
      {/* Waveform Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-off-white/10 pb-4">
        <div className="flex items-center gap-2.5">
          <div className="flex size-7 items-center justify-center rounded-lg bg-court-green/15 text-court-green border border-court-green/30">
            <Activity className="size-4" />
          </div>
          <div>
            <h4 className="font-display text-xs font-black tracking-[0.2em] text-off-white uppercase">
              BWF Momentum Waveform
            </h4>
            <p className="text-[11px] text-muted">Point-by-point lead differential and rally flow</p>
          </div>
        </div>

        {/* Game Filter Pills */}
        {availableGames > 1 && (
          <div className="inline-flex rounded-xl border border-off-white/10 bg-black/60 p-1">
            <button
              type="button"
              onClick={() => setSelectedGame(-1)}
              className={`rounded-lg px-2.5 py-1 font-display text-[11px] font-bold tracking-wider transition-all ${
                selectedGame === -1
                  ? "bg-court-green text-black shadow-md"
                  : "text-muted hover:text-off-white"
              }`}
            >
              All Match
            </button>
            {Array.from({ length: availableGames }, (_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setSelectedGame(i)}
                className={`rounded-lg px-2.5 py-1 font-display text-[11px] font-bold tracking-wider transition-all ${
                  selectedGame === i
                    ? "bg-court-green text-black shadow-md"
                    : "text-muted hover:text-off-white"
                }`}
              >
                Game {i + 1}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Side Dominance Indicators */}
      <div className="mt-3 flex items-center justify-between text-xs font-bold uppercase tracking-wider">
        <span className="flex items-center gap-1.5 text-court-green">
          <span>▲</span>
          <span>{sideAName}</span>
          {svgData && <span className="font-normal text-muted">(+{svgData.maxDiffAbs} max lead)</span>}
        </span>
        <span className="text-[10px] text-muted tracking-widest font-normal">0 Baseline = Tied</span>
        <span className="flex items-center gap-1.5 text-off-white">
          {svgData && <span className="font-normal text-muted">(+{svgData.maxDiffAbs} max lead)</span>}
          <span>{sideBName}</span>
          <span>▼</span>
        </span>
      </div>

      {/* SVG Waveform Chart Area */}
      {svgData && svgData.mapped.length > 0 ? (
        <div className="relative mt-2 w-full">
          <svg
            className="w-full h-40 sm:h-52 overflow-visible select-none cursor-crosshair"
            viewBox={`0 0 ${svgData.viewBoxW} ${svgData.viewBoxH}`}
            preserveAspectRatio="none"
            onMouseLeave={() => setHoveredPoint(null)}
            onTouchEnd={() => setHoveredPoint(null)}
          >
            <defs>
              <linearGradient id="momentumGradientA" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#10b981" stopOpacity="0.45" />
                <stop offset="100%" stopColor="#10b981" stopOpacity="0.0" />
              </linearGradient>
              <linearGradient id="momentumGradientB" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#ffffff" stopOpacity="0.0" />
                <stop offset="100%" stopColor="#38bdf8" stopOpacity="0.3" />
              </linearGradient>
              <filter id="waveformGlow" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="3.5" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>

            {/* Zero Differential Baseline (Dashed) */}
            <line
              x1={svgData.padX}
              y1={svgData.yCenter}
              x2={svgData.viewBoxW - svgData.padX}
              y2={svgData.yCenter}
              stroke="rgba(255,255,255,0.2)"
              strokeWidth="1.5"
              strokeDasharray="4 4"
            />

            {/* Shaded Area Under Waveform */}
            <path d={svgData.areaPath} fill="url(#momentumGradientA)" />

            {/* Main Glowing Bezier Waveform Line */}
            <path
              d={svgData.curvePath}
              fill="none"
              stroke="#10b981"
              strokeWidth="2.8"
              filter="url(#waveformGlow)"
            />

            {/* Key Rally Annotations (Intervals, Game Points) */}
            {svgData.mapped.map((pt) => {
              if (pt.isInterval) {
                return (
                  <g key={`interval-${pt.index}`}>
                    <line
                      x1={pt.x}
                      y1={12}
                      x2={pt.x}
                      y2={svgData.viewBoxH - 12}
                      stroke="#f59e0b"
                      strokeWidth="1.5"
                      strokeDasharray="3 3"
                      opacity="0.8"
                    />
                    <circle cx={pt.x} cy={pt.y} r="5" fill="#f59e0b" />
                  </g>
                );
              }
              if (pt.isMatchPoint) {
                return (
                  <g key={`matchpoint-${pt.index}`}>
                    <circle cx={pt.x} cy={pt.y} r="6" fill="#ef4444" className="animate-ping" opacity="0.6" />
                    <circle cx={pt.x} cy={pt.y} r="4.5" fill="#ef4444" />
                  </g>
                );
              }
              return null;
            })}

            {/* Hovered / Active Point Indicator */}
            {activeRally && (
              (() => {
                const pt = svgData.mapped.find((p) => p.index === activeRally.index);
                if (!pt) return null;
                return (
                  <g key="active-indicator">
                    <line
                      x1={pt.x}
                      y1={10}
                      x2={pt.x}
                      y2={svgData.viewBoxH - 10}
                      stroke="rgba(255, 255, 255, 0.4)"
                      strokeWidth="1"
                      strokeDasharray="2 2"
                    />
                    <circle
                      cx={pt.x}
                      cy={pt.y}
                      r="6"
                      fill="#ffffff"
                      stroke="#10b981"
                      strokeWidth="2.5"
                      className="shadow-lg"
                    />
                  </g>
                );
              })()
            )}

            {/* Interactive Touch/Click Column Targets */}
            {svgData.mapped.map((pt) => (
              <rect
                key={pt.index}
                x={pt.x - svgData.plotW / (svgData.mapped.length * 2)}
                y={0}
                width={svgData.plotW / svgData.mapped.length}
                height={svgData.viewBoxH}
                fill="transparent"
                onMouseEnter={() => setHoveredPoint(pt)}
                onTouchStart={() => setHoveredPoint(pt)}
                onTouchMove={() => setHoveredPoint(pt)}
              />
            ))}
          </svg>
        </div>
      ) : (
        <div className="mt-6 flex flex-col items-center justify-center p-8 text-center text-muted">
          <Info className="size-5 mb-2 opacity-50" />
          <p className="font-display text-xs uppercase tracking-wider">Awaiting match rally data</p>
        </div>
      )}

      {/* Interactive Rally HUD Banner */}
      {activeRally && (
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-off-white/10 bg-black/60 px-4 py-2.5 backdrop-blur-md">
          <div className="flex items-center gap-3">
            <span className="flex size-7 items-center justify-center rounded-lg bg-off-white/10 font-display text-xs font-bold text-off-white tabular-nums">
              #{activeRally.rallyNum}
            </span>
            <div>
              <p className="text-[10px] uppercase tracking-wider text-muted">Rally Status</p>
              <p className="font-display text-xs font-bold text-off-white">
                Game {activeRally.gameIndex + 1} · Point won by{" "}
                <span className={activeRally.winner === "a" ? "text-court-green" : "text-amber-300"}>
                  {activeRally.winner === "a" ? sideAName : sideBName}
                </span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-[10px] uppercase tracking-wider text-muted">Score</p>
              <p className="font-display text-sm font-black tabular-nums text-off-white">
                {activeRally.scoreA} – {activeRally.scoreB}
              </p>
            </div>

            <div className="text-right">
              <p className="text-[10px] uppercase tracking-wider text-muted">Lead</p>
              <p
                className={`font-display text-sm font-black tabular-nums ${
                  activeRally.diff > 0
                    ? "text-court-green"
                    : activeRally.diff < 0
                    ? "text-sky-400"
                    : "text-muted"
                }`}
              >
                {activeRally.diff > 0
                  ? `+${activeRally.diff} (${sideAName.split(" ")[0]})`
                  : activeRally.diff < 0
                  ? `+${Math.abs(activeRally.diff)} (${sideBName.split(" ")[0]})`
                  : "Level (Tied)"}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Waveform Key / Legend */}
      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-[11px] text-muted border-t border-off-white/10 pt-3">
        <div className="flex flex-wrap items-center gap-4">
          <span className="flex items-center gap-1.5">
            <span className="size-2 rounded-full bg-court-green" />
            <span>Green Area: Side A Lead</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="size-2 rounded-full bg-sky-400" />
            <span>Blue Area: Side B Lead</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="size-2 rounded-full bg-amber-400" />
            <span>11-Pt Interval</span>
          </span>
        </div>
        <span className="font-display text-[10px] tracking-widest uppercase text-muted/70">
          Official BWF Telemetry
        </span>
      </div>
    </div>
  );
}
