import { statusCopy, type Tournament, type TournamentStatus } from "@/lib/tournaments";

interface StatusBadgeProps {
  tournament: Tournament;
  status: TournamentStatus;
  now: number;
  className?: string;
}

/** Status line with a live dot (pulsing when urgent: closing soon or live). */
export default function StatusBadge({ tournament, status, now, className = "" }: StatusBadgeProps) {
  const copy = statusCopy(tournament, status, now);
  const isUrgent = copy.tone === "urgent";
  const isMuted = copy.tone === "muted";

  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full px-3 py-1 font-display text-[11px] font-bold tracking-[0.16em] uppercase transition-all duration-200 ${
        isMuted
          ? "border border-off-white/15 bg-off-white/5 text-muted"
          : isUrgent
            ? "border border-court-green/40 bg-court-green/15 text-court-green shadow-[0_0_12px_rgba(16,185,129,0.25)]"
            : "border border-court-green/30 bg-court-green/10 text-court-green"
      } ${className}`}
    >
      {!isMuted && (
        <span aria-hidden="true" className="relative flex size-2">
          {isUrgent && (
            <span className="absolute inline-flex size-full animate-ping rounded-full bg-court-green opacity-75 motion-reduce:hidden" />
          )}
          <span className="relative inline-flex size-2 rounded-full bg-court-green shadow-[0_0_6px_rgba(16,185,129,0.8)]" />
        </span>
      )}
      <span>{copy.label}</span>
    </span>
  );
}
