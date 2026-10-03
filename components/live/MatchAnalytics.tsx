"use client";

import { useMemo } from "react";
import { Activity, Flame, Zap } from "lucide-react";
import type { LiveMatch } from "@/lib/live/types";
import { sideName } from "@/components/live/CourtCard";
import type { Side } from "@/lib/live/scoring";

interface MatchAnalyticsProps {
  match: LiveMatch;
}

export default function MatchAnalytics({ match }: MatchAnalyticsProps) {
  const sideAName = sideName(match, "a");
  const sideBName = sideName(match, "b");

  const analytics = useMemo(() => {
    let totalA = 0;
    let totalB = 0;
    let maxStreakA = 0;
    let maxStreakB = 0;
    let currentStreakA = 0;
    let currentStreakB = 0;
    let serviceWinsA = 0;
    let serviceWinsB = 0;

    // Differential timeline for momentum chart
    let diff = 0;
    const timeline: { point: number; diff: number; side: Side }[] = [];

    match.history.forEach((h, idx) => {
      if (h.side === "a") {
        totalA++;
        currentStreakA++;
        currentStreakB = 0;
        if (currentStreakA > maxStreakA) maxStreakA = currentStreakA;
        if (h.previousServer === "a") serviceWinsA++;
        diff++;
      } else {
        totalB++;
        currentStreakB++;
        currentStreakA = 0;
        if (currentStreakB > maxStreakB) maxStreakB = currentStreakB;
        if (h.previousServer === "b") serviceWinsB++;
        diff--;
      }
      timeline.push({ point: idx + 1, diff, side: h.side });
    });

    // Also count points from games array if history is partial
    const gameSumA = match.games.reduce((acc, g) => acc + g.a, 0);
    const gameSumB = match.games.reduce((acc, g) => acc + g.b, 0);
    if (totalA === 0 && gameSumA > 0) totalA = gameSumA;
    if (totalB === 0 && gameSumB > 0) totalB = gameSumB;

    const totalPoints = totalA + totalB || 1;
    const pctA = Math.round((totalA / totalPoints) * 100);
    const pctB = 100 - pctA;

    return {
      totalA,
      totalB,
      pctA,
      pctB,
      maxStreakA,
      maxStreakB,
      serviceWinsA,
      serviceWinsB,
      timeline,
    };
  }, [match]);

  return (
    <div className="mt-6 rounded-2xl border border-white/10 bg-black/60 p-5 backdrop-blur-md animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-white/10 pb-3">
        <div className="flex items-center gap-2">
          <Activity className="size-4 text-court-green" />
          <h3 className="font-display text-xs font-bold tracking-[0.16em] uppercase text-off-white">
            BWF Match Analytics & Momentum
          </h3>
        </div>
        <span className="font-display text-[10px] font-bold tracking-[0.12em] uppercase text-muted">
          Rallies: {match.history.length || analytics.totalA + analytics.totalB}
        </span>
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

      {/* Key Metric Highlights Grid */}
      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {/* Streak A */}
        <div className="rounded-xl border border-white/5 bg-white/[0.02] p-3 text-center">
          <div className="flex items-center justify-center gap-1 text-[11px] font-bold text-muted uppercase">
            <Flame className="size-3 text-court-green" />
            <span>Best Run (A)</span>
          </div>
          <span className="mt-1 block font-display text-xl font-black text-court-green">
            {analytics.maxStreakA} <span className="text-xs font-normal text-muted">pts</span>
          </span>
        </div>

        {/* Streak B */}
        <div className="rounded-xl border border-white/5 bg-white/[0.02] p-3 text-center">
          <div className="flex items-center justify-center gap-1 text-[11px] font-bold text-muted uppercase">
            <Flame className="size-3 text-off-white" />
            <span>Best Run (B)</span>
          </div>
          <span className="mt-1 block font-display text-xl font-black text-off-white">
            {analytics.maxStreakB} <span className="text-xs font-normal text-muted">pts</span>
          </span>
        </div>

        {/* Service Hold Points A */}
        <div className="rounded-xl border border-white/5 bg-white/[0.02] p-3 text-center">
          <div className="flex items-center justify-center gap-1 text-[11px] font-bold text-muted uppercase">
            <Zap className="size-3 text-court-green" />
            <span>Serve Holds (A)</span>
          </div>
          <span className="mt-1 block font-display text-xl font-black text-court-green">
            {analytics.serviceWinsA}
          </span>
        </div>

        {/* Service Hold Points B */}
        <div className="rounded-xl border border-white/5 bg-white/[0.02] p-3 text-center">
          <div className="flex items-center justify-center gap-1 text-[11px] font-bold text-muted uppercase">
            <Zap className="size-3 text-off-white" />
            <span>Serve Holds (B)</span>
          </div>
          <span className="mt-1 block font-display text-xl font-black text-off-white">
            {analytics.serviceWinsB}
          </span>
        </div>
      </div>

      {/* Momentum Differential Sparkline / Visual Timeline */}
      {analytics.timeline.length > 3 && (
        <div className="mt-4 pt-3 border-t border-white/5">
          <span className="block font-display text-[10px] font-bold tracking-[0.14em] text-muted uppercase mb-2">
            Rally-by-Rally Lead Swings (+ Side A / - Side B)
          </span>
          <div className="flex items-center gap-0.5 h-12 w-full overflow-x-auto py-1 scrollbar-none">
            {analytics.timeline.map((item, i) => {
              const isLeadA = item.diff > 0;
              const h = Math.min(Math.abs(item.diff) * 3 + 8, 44);
              return (
                <div
                  key={i}
                  title={`Point ${item.point}: ${item.diff > 0 ? `+${item.diff} ${sideAName}` : `${item.diff} ${sideBName}`}`}
                  className="flex flex-col items-center justify-center h-full w-2 shrink-0 group relative"
                >
                  <div
                    style={{ height: `${h}px` }}
                    className={`w-1 rounded-full transition-all ${
                      isLeadA
                        ? "bg-court-green shadow-[0_0_6px_rgba(16,185,129,0.8)]"
                        : "bg-off-white/60"
                    }`}
                  />
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
