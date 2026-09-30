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
  return (
    <p
      className={`flex items-center gap-2 font-display text-xs font-semibold tracking-[0.18em] uppercase ${
        copy.tone === "muted" ? "text-muted" : "text-court-green"
      } ${className}`}
    >
      {copy.tone !== "muted" && (
        <span aria-hidden="true" className="relative flex size-2">
          {copy.tone === "urgent" && (
            <span className="absolute inline-flex size-full animate-ping rounded-full bg-court-green opacity-60 motion-reduce:hidden" />
          )}
          <span className="relative inline-flex size-2 rounded-full bg-court-green" />
        </span>
      )}
      {copy.label}
    </p>
  );
}
