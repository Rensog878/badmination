import Link from "next/link";
import { ArrowUpRight, MapPin } from "lucide-react";
import {
  CLOSING_SOON_DAYS,
  daysToClose,
  daysToOpen,
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

const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? "" : "s"}`;

function statusCopy(t: Tournament, status: TournamentStatus, now: number) {
  switch (status) {
    case "open": {
      const days = daysToClose(t, now);
      const soon = days <= CLOSING_SOON_DAYS;
      return { label: soon ? `Closes in ${plural(days, "day")}` : "Registration open", tone: soon ? "urgent" : "open" } as const;
    }
    case "full":
      return { label: "Full · waitlist", tone: "muted" } as const;
    case "upcoming":
      return { label: `Opens in ${plural(daysToOpen(t, now), "day")}`, tone: "muted" } as const;
    case "closed":
      return { label: "Entries closed", tone: "muted" } as const;
    case "live":
      return { label: "Live now", tone: "urgent" } as const;
    case "completed":
      return { label: "Completed", tone: "muted" } as const;
  }
}

/** One fixture in the broadcast-style listing. The whole row links to the details page. */
export default function TournamentRow({ tournament: t, status, now }: TournamentRowProps) {
  const date = formatDay(t.startDate);
  const copy = statusCopy(t, status, now);
  const fill = Math.min(1, t.registered / t.capacity);
  const spotsLeft = Math.max(0, t.capacity - t.registered);
  const showCapacity = status === "open" || status === "full";

  return (
    <article className="group relative grid grid-cols-[4.5rem_1fr] gap-x-5 gap-y-4 border-b border-off-white/10 py-7 transition-colors hover:bg-off-white/[0.025] sm:grid-cols-[5.5rem_1fr] lg:grid-cols-[6rem_minmax(0,1.4fr)_minmax(0,1fr)_11rem_11rem_2rem] lg:items-center lg:gap-x-8 lg:px-4">
      <div className="row-span-2 border-r border-off-white/10 pr-4 lg:row-span-1 lg:border-r-0 lg:pr-0">
        <p className="font-display text-4xl leading-none font-bold tracking-[-0.02em] sm:text-5xl">{date.day}</p>
        <p className="mt-1 font-display text-xs tracking-[0.25em] text-muted uppercase">
          {date.month} {date.year}
        </p>
      </div>

      <div className="min-w-0">
        <p className="font-display text-[0.65rem] tracking-[0.3em] text-court-green uppercase">{t.level}</p>
        <h3 className="mt-1.5 font-display text-xl leading-tight font-bold tracking-[-0.01em] uppercase sm:text-2xl">
          <Link
            href={`/tournaments/${t.slug}`}
            className="after:absolute after:inset-0 focus-visible:outline-none after:focus-visible:outline-2 after:focus-visible:outline-court-green"
          >
            {t.name}
          </Link>
        </h3>
        <p className="mt-2 flex gap-1.5 text-sm text-muted">
          <MapPin aria-hidden="true" className="mt-0.5 size-3.5 shrink-0" />
          <span>
            {t.venue}, {t.city} <span className="whitespace-nowrap">· {formatRange(t.startDate, t.endDate)}</span>
          </span>
        </p>
      </div>

      <ul aria-label="Events" className="col-start-2 flex flex-wrap gap-1.5 lg:col-start-auto">
        {t.events.map((e) => (
          <li key={eventLabel(e)} className="border border-off-white/15 px-2 py-1 text-[0.7rem] tracking-[0.08em] text-off-white/85 uppercase">
            {eventLabel(e)}
          </li>
        ))}
      </ul>

      <div className="col-start-2 lg:col-start-auto">
        <p className="font-display text-lg font-semibold">
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
              className="h-1 w-full max-w-40 bg-off-white/10"
            >
              <div className="h-full bg-court-green" style={{ width: `${fill * 100}%` }} />
            </div>
            <p className="mt-1.5 text-xs text-muted">{spotsLeft > 0 ? `${spotsLeft} spots left` : `${t.capacity} / ${t.capacity} entries`}</p>
          </div>
        )}
        {t.prizePool && !showCapacity && <p className="mt-1 text-xs text-muted">Prize pool {formatInr(t.prizePool)}</p>}
      </div>

      <p
        className={`col-start-2 flex items-center gap-2 font-display text-xs font-semibold tracking-[0.18em] uppercase lg:col-start-auto ${
          copy.tone === "muted" ? "text-muted" : "text-court-green"
        }`}
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

      <ArrowUpRight
        aria-hidden="true"
        className="absolute top-7 right-0 size-5 text-muted transition-[color,transform] group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-court-green lg:static motion-reduce:transition-none"
      />
    </article>
  );
}
