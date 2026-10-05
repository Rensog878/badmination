"use client";

import type { Side } from "@/lib/live/scoring";

interface MiniRallySparklineProps {
  history: (Side | { side: Side })[];
  count?: number;
}

export default function MiniRallySparkline({
  history,
  count = 10,
}: MiniRallySparklineProps) {
  const recent = history.slice(-count);

  if (recent.length === 0) return null;

  return (
    <div className="flex items-center gap-1.5" title="Recent rally streak: Green = Side A, Amber = Side B">
      <span className="font-mono text-[9px] text-muted tracking-tight">STREAK:</span>
      <div className="flex items-center gap-1">
        {recent.map((item, i) => {
          const side = typeof item === "string" ? item : item.side;
          return (
            <span
              key={i}
              className={`inline-block w-1.5 h-3.5 rounded-xs transition-all ${
                side === "a"
                  ? "bg-court-green shadow-[0_0_4px_rgba(16,185,129,0.8)]"
                  : "bg-amber-400 shadow-[0_0_4px_rgba(251,191,36,0.8)]"
              }`}
            />
          );
        })}
      </div>
    </div>
  );
}
