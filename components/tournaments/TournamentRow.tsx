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
    <article className="group relative grid grid-cols-[4.5rem_1fr] gap-x-5 gap-y-4 border-b border-off-white/10 py-7 transition-all duration-300 hover:bg-off-white/[0.04] sm:grid-cols-[5.5rem_1fr] lg:grid-cols-[6rem_minmax(0,1.4fr)_minmax(0,1fr)_11rem_11rem_2rem] lg:items-center lg:gap-x-8 lg:px-4 lg:rounded-2xl">
      <div className="row-span-2 border-r border-off-white/10 pr-4 lg:row-span-1 lg:border-r-0 lg:pr-0">
        <p className="font-display text-4xl leading-none font-black tracking-[-0.03em] sm:text-5xl">{date.day}</p>
        <p className="mt-1 font-display text-xs font-semibold tracking-[0.16em] text-muted uppercase">
          {date.month} {date.year}
        </p>
      </div>

      <div className="min-w-0">
        <span className="inline-block font-display text-[11px] font-bold tracking-[0.18em] text-court-green uppercase">
          {t.level}
        </span>
        <h3 className="mt-1 font-display text-xl leading-tight font-extrabold tracking-[-0.01em] uppercase sm:text-2xl transition-colors group-hover:text-court-green">
          <Link
            href={`/tournaments/${t.slug}`}
            className="after:absolute after:inset-0 focus-visible:outline-none after:focus-visible:outline-2 after:focus-visible:outline-court-green"
          >
            {t.name}
          </Link>
        </h3>
        <p className="mt-2 flex items-center gap-1.5 text-sm text-muted">
          <MapPin aria-hidden="true" className="size-3.5 shrink-0 text-court-green/80" />
          <span>
            {t.venue}, {t.city} <span className="whitespace-nowrap">· {formatRange(t.startDate, t.endDate)}</span>
          </span>
        </p>
      </div>

      <ul aria-label="Events" className="col-start-2 flex flex-wrap gap-1.5 lg:col-start-auto">
        {t.events.map((e) => (
          <li key={eventLabel(e)} className="rounded-md border border-off-white/15 bg-off-white/[0.04] px-2.5 py-1 text-xs font-semibold tracking-[0.08em] text-off-white/85 uppercase">
            {eventLabel(e)}
          </li>
        ))}
      </ul>

      <div className="col-start-2 lg:col-start-auto">
        <p className="font-display text-lg font-bold">
          {formatInr(t.entryFee)}
          <span className="ml-1 text-xs font-normal text-muted">/ event</span>
        </p>
        {showCapacity && (
          <div className="mt-2">
            <div
              role="meter"
              aria-label="Entries filled"
              aria-valuemin={0}
              aria-valuemax={t.capacity}
              aria-valuenow={t.registered}
              className="h-1.5 w-full max-w-40 rounded-full bg-off-white/10 overflow-hidden"
            >
              <div className="h-full rounded-full bg-court-green transition-all duration-500" style={{ width: `${fill * 100}%` }} />
            </div>
            <p className="mt-1.5 text-xs font-medium text-muted">{spotsLeft > 0 ? `${spotsLeft} spots left` : `${t.capacity} / ${t.capacity} entries`}</p>
          </div>
        )}
        {t.prizePool && !showCapacity && <p className="mt-1 text-xs font-medium text-muted">Prize pool {formatInr(t.prizePool)}</p>}
      </div>

      <StatusBadge tournament={t} status={status} now={now} className="col-start-2 lg:col-start-auto" />

      <ArrowUpRight
        aria-hidden="true"
        className="absolute top-7 right-0 size-5 text-muted transition-all duration-300 group-hover:translate-x-1 group-hover:-translate-y-1 group-hover:text-court-green lg:static motion-reduce:transition-none"
      />
    </article>
  );
}
