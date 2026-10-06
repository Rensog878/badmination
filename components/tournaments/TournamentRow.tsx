import Link from "next/link";
import { ArrowUpRight, MapPin, Trophy, Sparkles } from "lucide-react";
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

const LEVEL_THEMES: Record<string, { bg: string; text: string; border: string; glow: string }> = {
  State: {
    bg: "bg-amber-400/15",
    text: "text-amber-400",
    border: "border-amber-400/40",
    glow: "shadow-[0_0_10px_rgba(251,191,36,0.25)]",
  },
  District: {
    bg: "bg-cyan-400/15",
    text: "text-cyan-400",
    border: "border-cyan-400/40",
    glow: "shadow-[0_0_10px_rgba(34,211,238,0.25)]",
  },
  Club: {
    bg: "bg-emerald-400/15",
    text: "text-emerald-400",
    border: "border-emerald-400/40",
    glow: "shadow-[0_0_10px_rgba(52,211,153,0.25)]",
  },
  Open: {
    bg: "bg-purple-400/15",
    text: "text-purple-400",
    border: "border-purple-400/40",
    glow: "shadow-[0_0_10px_rgba(192,132,252,0.25)]",
  },
};

/** One fixture in the broadcast-style listing. The whole row links to the details page. */
export default function TournamentRow({ tournament: t, status, now }: TournamentRowProps) {
  const date = formatDay(t.startDate);
  const fill = Math.min(1, t.registered / t.capacity);
  const spotsLeft = Math.max(0, t.capacity - t.registered);
  const showCapacity = status === "open" || status === "full";
  const levelTheme = LEVEL_THEMES[t.level] || LEVEL_THEMES.Open;

  return (
    <article className="group relative rounded-2xl border border-white/10 bg-gradient-to-r from-black/60 via-black/40 to-black/60 p-4 sm:p-5 mb-3.5 backdrop-blur-xl transition-all duration-300 hover:border-court-green/50 hover:bg-white/[0.04] hover:shadow-[0_12px_36px_rgba(0,0,0,0.5)] active:scale-[0.99] lg:grid lg:grid-cols-[5.5rem_minmax(0,1.7fr)_minmax(0,1.1fr)_10rem_11rem_2.5rem] lg:items-center lg:gap-x-8 lg:px-6 lg:py-6">
      {/* Mobile Top Bar: Date pill + Level badge + Prize Ribbon + Arrow */}
      <div className="flex items-center justify-between gap-2.5 lg:hidden pb-3 border-b border-white/10">
        <div className="flex items-center gap-2">
          {/* Compact Calendar Pill */}
          <span className="inline-flex items-center gap-1.5 rounded-lg border border-white/15 bg-white/5 px-2.5 py-1 font-display text-xs font-bold text-off-white shadow-xs">
            <span className="text-sm font-black text-court-green">{date.day}</span>
            <span className="text-[10px] tracking-wider uppercase text-muted">{date.month}</span>
          </span>

          {/* Level Badge */}
          <span className={`inline-flex items-center rounded-md border px-2 py-0.5 font-display text-[10px] font-bold tracking-[0.16em] uppercase ${levelTheme.bg} ${levelTheme.text} ${levelTheme.border} ${levelTheme.glow}`}>
            {t.level}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {t.prizePool && (
            <span className="inline-flex items-center gap-1 rounded-md border border-amber-400/30 bg-amber-400/10 px-2 py-0.5 text-[10px] font-bold text-amber-300 uppercase tracking-wider">
              <Trophy className="size-2.5" />
              <span>{formatInr(t.prizePool)}</span>
            </span>
          )}
          <ArrowUpRight
            aria-hidden="true"
            className="size-4 text-muted transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-court-green"
          />
        </div>
      </div>

      {/* Desktop Col 1: High-Contrast Date block */}
      <div className="hidden lg:block">
        <p className="font-display text-4xl leading-none font-black tracking-[-0.03em] text-off-white group-hover:text-court-green transition-colors sm:text-5xl">{date.day}</p>
        <p className="mt-1 font-display text-xs font-bold tracking-[0.16em] text-muted uppercase">
          {date.month} {date.year}
        </p>
      </div>

      {/* Title & Venue */}
      <div className="mt-3 min-w-0 lg:mt-0">
        <div className="hidden lg:flex items-center gap-2 mb-1">
          <span className={`inline-flex items-center rounded-md border px-2 py-0.5 font-display text-[10px] font-bold tracking-[0.16em] uppercase ${levelTheme.bg} ${levelTheme.text} ${levelTheme.border} ${levelTheme.glow}`}>
            {t.level}
          </span>
          {t.prizePool && (
            <span className="inline-flex items-center gap-1 rounded-md border border-amber-400/30 bg-amber-400/10 px-2 py-0.5 text-[10px] font-bold text-amber-300 uppercase tracking-wider">
              <Trophy className="size-2.5" />
              <span>Purse: {formatInr(t.prizePool)}</span>
            </span>
          )}
        </div>

        <h3 className="font-display text-lg leading-snug font-extrabold tracking-[-0.01em] uppercase sm:text-xl lg:text-2xl transition-colors text-off-white group-hover:text-court-green">
          <Link
            href={`/tournaments/${t.slug}`}
            className="after:absolute after:inset-0 focus-visible:outline-none after:focus-visible:outline-2 after:focus-visible:outline-court-green"
          >
            {t.name}
          </Link>
        </h3>

        <p className="mt-1.5 flex items-center gap-1.5 text-xs text-muted sm:text-sm">
          <MapPin aria-hidden="true" className="size-3.5 shrink-0 text-court-green" />
          <span className="truncate">
            {t.venue}, {t.city} <span className="whitespace-nowrap text-off-white/60">· {formatRange(t.startDate, t.endDate)}</span>
          </span>
        </p>
      </div>

      {/* Events tags */}
      <div className="mt-3 lg:mt-0">
        <ul aria-label="Events" className="flex flex-wrap gap-1.5">
          {t.events.map((e) => (
            <li key={eventLabel(e)} className="rounded-md border border-white/10 bg-white/[0.04] px-2.5 py-1 text-[11px] font-semibold tracking-[0.08em] text-off-white/90 uppercase shadow-xs group-hover:border-court-green/30 transition-colors">
              {eventLabel(e)}
            </li>
          ))}
        </ul>
      </div>

      {/* Fee & Capacity */}
      <div className="mt-3.5 flex items-center justify-between gap-4 border-t border-white/10 pt-3 lg:border-none lg:pt-0 lg:mt-0 lg:block">
        <div>
          <p className="font-display text-base font-bold lg:text-lg text-off-white">
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
                className="h-1.5 w-28 sm:w-36 rounded-full bg-white/10 overflow-hidden"
              >
                <div className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-court-green shadow-[0_0_8px_rgba(16,185,129,0.7)] transition-all duration-500" style={{ width: `${fill * 100}%` }} />
              </div>
              <p className="mt-1 text-[10px] font-medium text-muted">{spotsLeft > 0 ? `${spotsLeft} spots remaining` : `Full (${t.capacity} entries)`}</p>
            </div>
          )}
          {t.prizePool && !showCapacity && (
            <p className="mt-1 text-xs font-semibold text-amber-400/90 flex items-center gap-1">
              <Sparkles className="size-3" />
              <span>Pool: {formatInr(t.prizePool)}</span>
            </p>
          )}
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

      {/* Desktop Col 6: Arrow Action Button */}
      <div className="hidden lg:flex lg:justify-end">
        <span className="inline-flex size-10 items-center justify-center rounded-xl border border-white/10 bg-white/[0.03] text-muted transition-all duration-300 group-hover:border-court-green group-hover:bg-court-green group-hover:text-black group-hover:shadow-[0_0_15px_rgba(16,185,129,0.4)] motion-reduce:transition-none">
          <ArrowUpRight
            aria-hidden="true"
            className="size-5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
          />
        </span>
      </div>
    </article>
  );
}
