import Link from "next/link";
import { ArrowUpRight, MapPin } from "lucide-react";
import StatusBadge from "@/components/tournaments/StatusBadge";
import {
  eventLabel,
  formatDay,
  formatInr,
  formatRange,
  type Tournament,
  type TournamentStatus,
} from "@/lib/tournaments";

interface TournamentRowProps {
  tournament: Tournament;
  status: TournamentStatus;
  now: number;
}

/** One fixture in the broadcast-style listing. The whole row links to the details page. */
export default function TournamentRow({ tournament: t, status, now }: TournamentRowProps) {
  const date = formatDay(t.startDate);
  const fill = Math.min(1, t.registered / t.capacity);
  const spotsLeft = Math.max(0, t.capacity - t.registered);
  const showCapacity = status === "open" || status === "full";

  return (
    <article className="group relative border-b border-off-white/10 py-6 transition-all duration-300 hover:bg-off-white/[0.04] active:scale-[0.99] lg:grid lg:grid-cols-[5rem_minmax(0,1.6fr)_minmax(0,1fr)_10rem_11rem_2rem] lg:items-center lg:gap-x-8 lg:px-5 lg:py-6 lg:rounded-2xl lg:hover:border lg:hover:border-court-green/30 lg:hover:shadow-[0_12px_32px_rgba(0,0,0,0.35)]">
      {/* Mobile Header: Date badge + Level + Arrow */}
      <div className="flex items-center justify-between gap-3 lg:hidden">
        <div className="flex items-center gap-2.5">
          <span className="inline-flex items-center gap-1 rounded-lg border border-off-white/15 bg-off-white/5 px-2.5 py-1 font-display text-xs font-bold text-off-white">
            <span className="text-sm font-black text-court-green">{date.day}</span>
            <span className="text-[10px] tracking-wider uppercase text-muted">{date.month}</span>
          </span>
          <span className="font-display text-[11px] font-bold tracking-[0.18em] text-court-green uppercase">
            {t.level}
          </span>
        </div>
        <ArrowUpRight
          aria-hidden="true"
          className="size-4 text-muted transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-court-green"
        />
      </div>

      {/* Desktop Col 1: Date block */}
      <div className="hidden lg:block">
        <p className="font-display text-4xl leading-none font-black tracking-[-0.03em] sm:text-5xl">{date.day}</p>
        <p className="mt-1 font-display text-xs font-semibold tracking-[0.16em] text-muted uppercase">
          {date.month} {date.year}
        </p>
      </div>

      {/* Title & Venue */}
      <div className="mt-3 min-w-0 lg:mt-0">
        <span className="hidden lg:inline-block font-display text-[11px] font-bold tracking-[0.18em] text-court-green uppercase">
          {t.level}
        </span>
        <h3 className="font-display text-lg leading-snug font-extrabold tracking-[-0.01em] uppercase sm:text-xl lg:mt-1 lg:text-2xl transition-colors group-hover:text-court-green">
          <Link
            href={`/tournaments/${t.slug}`}
            className="after:absolute after:inset-0 focus-visible:outline-none after:focus-visible:outline-2 after:focus-visible:outline-court-green"
          >
            {t.name}
          </Link>
        </h3>
        <p className="mt-1.5 flex items-center gap-1.5 text-xs text-muted sm:text-sm">
          <MapPin aria-hidden="true" className="size-3.5 shrink-0 text-court-green/80" />
          <span className="truncate">
            {t.venue}, {t.city} <span className="whitespace-nowrap">· {formatRange(t.startDate, t.endDate)}</span>
          </span>
        </p>
      </div>

      {/* Events tags */}
      <div className="mt-3 lg:mt-0">
        <ul aria-label="Events" className="flex flex-wrap gap-1.5">
          {t.events.map((e) => (
            <li key={eventLabel(e)} className="rounded-md border border-off-white/15 bg-off-white/[0.04] px-2.5 py-0.5 text-xs font-semibold tracking-[0.08em] text-off-white/85 uppercase">
              {eventLabel(e)}
            </li>
          ))}
        </ul>
      </div>

      {/* Fee & Capacity */}
      <div className="mt-3 flex items-center justify-between gap-4 lg:mt-0 lg:block">
        <div>
          <p className="font-display text-base font-bold lg:text-lg">
            {formatInr(t.entryFee)}
            <span className="ml-1 text-xs font-normal text-muted">/ event</span>
          </p>
          {showCapacity && (
            <div className="mt-1.5">
              <div
                role="meter"
                aria-label="Entries filled"
                aria-valuemin={0}
                aria-valuemax={t.capacity}
                aria-valuenow={t.registered}
                className="h-1.5 w-28 sm:w-36 rounded-full bg-off-white/10 overflow-hidden"
              >
                <div className="h-full rounded-full bg-court-green transition-all duration-500" style={{ width: `${fill * 100}%` }} />
              </div>
              <p className="mt-1 text-[11px] font-medium text-muted">{spotsLeft > 0 ? `${spotsLeft} spots left` : `${t.capacity} / ${t.capacity} entries`}</p>
            </div>
          )}
          {t.prizePool && !showCapacity && <p className="mt-1 text-xs font-medium text-muted">Prize pool {formatInr(t.prizePool)}</p>}
        </div>

        {/* Mobile Status badge on the right of fee */}
        <div className="lg:hidden">
          <StatusBadge tournament={t} status={status} now={now} className="w-fit" />
        </div>
      </div>

      {/* Desktop Col 5: StatusBadge */}
      <div className="hidden lg:block">
        <StatusBadge tournament={t} status={status} now={now} className="w-fit" />
      </div>

      {/* Desktop Col 6: Arrow */}
      <div className="hidden lg:flex lg:justify-end">
        <ArrowUpRight
          aria-hidden="true"
          className="size-5 text-muted transition-all duration-300 group-hover:translate-x-1 group-hover:-translate-y-1 group-hover:text-court-green motion-reduce:transition-none"
        />
      </div>
    </article>
  );
}
