"use client";

import type { Side } from "@/lib/live/scoring";

interface BwfServiceRadarProps {
  server: Side;
  serverScore: number;
  compact?: boolean;
}

/**
 * Official BWF Rule §10 & §11:
 * - Even Score (0, 2, 4, 6...) -> Right Service Court
 * - Odd Score  (1, 3, 5, 7...) -> Left Service Court
 *
 * Visualizes the 4 service quadrants (Top Side vs Bottom Side) with active server & receiver.
 */
export default function BwfServiceRadar({
  server,
  serverScore,
  compact = false,
}: BwfServiceRadarProps) {
  // In badminton perspective: Right court is even, Left is odd
  const isServerEven = serverScore % 2 === 0;
  const isServerRight = isServerEven;

  // Receiver stands diagonally opposite to the server
  const isReceiverRight = isServerRight;

  return (
    <div
      title={`BWF Service Radar: Side ${server.toUpperCase()} serving from ${
        isServerRight ? "Right (Even)" : "Left (Odd)"
      } Court`}
      className={`inline-flex items-center gap-2 rounded-lg border border-off-white/10 bg-black/40 px-2 py-1 ${
        compact ? "scale-90 origin-right" : ""
      }`}
    >
      <div className="flex flex-col items-center">
        <span className="font-mono text-[8px] font-bold text-muted uppercase">BWF</span>
        <span className="font-mono text-[7px] text-court-green font-bold">
          {isServerEven ? "EVEN" : "ODD"}
        </span>
      </div>

      {/* Mini Court Grid (Top Side A / Bottom Side B) */}
      <div className="relative flex flex-col w-9 h-7 rounded border border-court-green/30 bg-emerald-950/20 overflow-hidden divide-y divide-court-green/30">
        {/* Side A (Top) */}
        <div className="flex-1 grid grid-cols-2 divide-x divide-court-green/30">
          {/* Left Court (Side A) */}
          <div
            className={`flex items-center justify-center transition-all ${
              server === "a" && !isServerRight
                ? "bg-court-green shadow-[0_0_8px_rgba(16,185,129,0.8)]"
                : server === "b" && !isReceiverRight
                ? "bg-amber-400/30"
                : "bg-transparent"
            }`}
          >
            {server === "a" && !isServerRight && (
              <span className="size-1 rounded-full bg-black animate-pulse" />
            )}
          </div>

          {/* Right Court (Side A) */}
          <div
            className={`flex items-center justify-center transition-all ${
              server === "a" && isServerRight
                ? "bg-court-green shadow-[0_0_8px_rgba(16,185,129,0.8)]"
                : server === "b" && isReceiverRight
                ? "bg-amber-400/30"
                : "bg-transparent"
            }`}
          >
            {server === "a" && isServerRight && (
              <span className="size-1 rounded-full bg-black animate-pulse" />
            )}
          </div>
        </div>

        {/* Center Net Line */}
        <div className="h-[0.5px] bg-court-green w-full" />

        {/* Side B (Bottom) */}
        <div className="flex-1 grid grid-cols-2 divide-x divide-court-green/30">
          {/* Left Court (Side B) */}
          <div
            className={`flex items-center justify-center transition-all ${
              server === "b" && !isServerRight
                ? "bg-court-green shadow-[0_0_8px_rgba(16,185,129,0.8)]"
                : server === "a" && !isReceiverRight
                ? "bg-amber-400/30"
                : "bg-transparent"
            }`}
          >
            {server === "b" && !isServerRight && (
              <span className="size-1 rounded-full bg-black animate-pulse" />
            )}
          </div>

          {/* Right Court (Side B) */}
          <div
            className={`flex items-center justify-center transition-all ${
              server === "b" && isServerRight
                ? "bg-court-green shadow-[0_0_8px_rgba(16,185,129,0.8)]"
                : server === "a" && isReceiverRight
                ? "bg-amber-400/30"
                : "bg-transparent"
            }`}
          >
            {server === "b" && isServerRight && (
              <span className="size-1 rounded-full bg-black animate-pulse" />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
