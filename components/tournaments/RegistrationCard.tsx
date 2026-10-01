import Link from "next/link";
import { ArrowRight } from "lucide-react";
import StatusBadge from "@/components/tournaments/StatusBadge";
import { TRIAL } from "@/lib/content";
import {
  daysToClose,
  formatInr,
  formatRange,
  registerHref,
  type Tournament,
  type TournamentStatus,
} from "@/lib/tournaments";

interface RegistrationCardProps {
  tournament: Tournament;
  status: TournamentStatus;
  now: number;
}

const fmt = (iso: string) => formatRange(iso, iso);

/** Sticky entry card: fee, deadline, capacity and the one action that fits the current status. */
export default function RegistrationCard({ tournament: t, status, now }: RegistrationCardProps) {
  const spotsLeft = Math.max(0, t.capacity - t.registered);
  const days = daysToClose(t, now);

  return (
    <aside aria-label="Registration" className="rounded-2xl border border-off-white/10 bg-black p-6 sm:p-8">
      <StatusBadge tournament={t} status={status} now={now} />
      <p className="mt-6 font-display text-4xl font-bold">
        {formatInr(t.entryFee)}
        <span className="ml-2 text-sm font-normal text-muted">per event</span>
      </p>

      <dl className="mt-6 space-y-3 border-t border-off-white/10 pt-6 text-sm">
        <div className="flex justify-between gap-4">
          <dt className="text-muted">Entries open</dt>
          <dd>{fmt(t.registrationOpens)}</dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt className="text-muted">Entries close</dt>
          <dd>{fmt(t.registrationCloses)}</dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt className="text-muted">Entries</dt>
          <dd>
            {t.registered} / {t.capacity}
          </dd>
        </div>
      </dl>
      <div
        role="meter"
        aria-label="Entries filled"
        aria-valuemin={0}
        aria-valuemax={t.capacity}
        aria-valuenow={t.registered}
        className="mt-4 h-1 bg-off-white/10"
      >
        <div className="h-full bg-court-green" style={{ width: `${Math.min(1, t.registered / t.capacity) * 100}%` }} />
      </div>

      <div className="mt-8">
        {status === "open" && (
          <>
            <Link
              href={registerHref(t)}
              className="rounded-lg group flex items-center justify-between bg-court-green px-6 py-4 font-display text-sm font-semibold tracking-[0.14em] text-black uppercase transition-colors hover:bg-off-white"
            >
              Register now
              <ArrowRight aria-hidden="true" className="size-4 transition-transform group-hover:translate-x-1 motion-reduce:transition-none" />
            </Link>
            <p className="mt-3 text-xs text-muted">
              {spotsLeft} spots left · closes in {days} day{days === 1 ? "" : "s"}
            </p>
          </>
        )}
        {status === "full" && (
          <p className="text-sm text-muted">
            The draw is full.{" "}
            <a className="text-court-green underline underline-offset-4" href={`mailto:${TRIAL.email}?subject=${encodeURIComponent(`Waitlist: ${t.name}`)}`}>
              Join the waitlist
            </a>
          </p>
        )}
        {status === "upcoming" && (
          <p className="rounded-lg border border-off-white/15 px-6 py-4 text-center font-display text-xs font-semibold tracking-[0.14em] text-muted uppercase">
            Registration opens {fmt(t.registrationOpens)}
          </p>
        )}
        {(status === "closed" || status === "live") && <p className="text-sm text-muted">Entries are closed for this tournament.</p>}
        {status === "completed" && <p className="text-sm text-muted">This tournament has finished. Results will be published here.</p>}
      </div>
    </aside>
  );
}
