import type { Metadata } from "next";
import { findTournament, listTournaments } from "@/lib/data/tournaments";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight, ExternalLink, Radio } from "lucide-react";
import RegistrationCard from "@/components/tournaments/RegistrationCard";
import StatusBadge from "@/components/tournaments/StatusBadge";
import TournamentRow from "@/components/tournaments/TournamentRow";
import CourtLines from "@/components/ui/CourtLines";
import { SITE } from "@/lib/content";
import { liveAvailable } from "@/lib/live/store";
import {
  dayStart,
  describeTournament,
  eventLabel,
  formatInr,
  formatRange,
  GENERAL_RULES,
  getStatus,
  mapsUrl,
  provisionalSchedule,
  registerHref,
} from "@/lib/tournaments";

/** Status depends on the date: re-render hourly. Unknown slugs 404. */
export const revalidate = 3600;

const RELATED_COUNT = 3;

type PageProps = { params: Promise<{ slug: string }> };

export async function generateStaticParams() {
  return (await listTournaments()).map((t) => ({ slug: t.slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const t = await findTournament((await params).slug);
  if (!t) return {};
  return {
    title: `${t.name} · ${formatRange(t.startDate, t.endDate)} | ${SITE.title}`,
    description: describeTournament(t),
  };
}

export default async function TournamentPage({ params }: PageProps) {
  const t = await findTournament((await params).slug);
  if (!t) notFound();

  const now = Date.now();
  const status = getStatus(t, now);
  const related = (await listTournaments()).filter((o) => o.slug !== t.slug && getStatus(o, now) !== "completed")
    .sort((a, b) => dayStart(a.startDate) - dayStart(b.startDate))
    .slice(0, RELATED_COUNT);

  const facts = [
    { label: "Dates", value: formatRange(t.startDate, t.endDate) },
    { label: "Level", value: `${t.level} level` },
    { label: "Entry fee", value: `${formatInr(t.entryFee)} per event` },
    { label: "Draw size", value: `${t.capacity} entries` },
    ...(t.prizePool ? [{ label: "Prize pool", value: formatInr(t.prizePool) }] : []),
  ];

  return (
    <main id="main" className="min-h-svh bg-charcoal pb-28 lg:pb-0">
      <header className="relative overflow-hidden border-b border-off-white/10 pt-28 pb-14 lg:pt-36 lg:pb-20">
        <CourtLines
          aria-hidden="true"
          className="pointer-events-none absolute top-1/2 -right-40 w-[900px] max-w-none -translate-y-1/2 text-off-white/[0.06]"
          strokeWidth={0.3}
        />
        <div className="relative mx-auto max-w-[1600px] px-4 sm:px-8 lg:px-16">
          <Link
            href="/#tournaments"
            className="inline-flex items-center gap-2 font-display text-xs tracking-[0.15em] text-muted uppercase transition-colors hover:text-off-white"
          >
            <ArrowLeft aria-hidden="true" className="size-4" />
            All tournaments
          </Link>
          <p className="mt-10 font-display text-xs tracking-[0.18em] text-court-green uppercase">{t.level} · {t.city}</p>
          <h1 className="mt-4 max-w-4xl font-display text-[clamp(2.75rem,8vw,7rem)] leading-[0.9] font-bold tracking-[-0.03em] uppercase">
            {t.name}
          </h1>
          <div className="mt-8 flex flex-wrap items-center gap-x-8 gap-y-3">
            <p className="font-display text-lg font-semibold">{formatRange(t.startDate, t.endDate)}</p>
            <p className="text-muted">{t.venue}</p>
            <StatusBadge tournament={t} status={status} now={now} />
            {liveAvailable(t, now).available && (
              <Link
                href={`/tournaments/${t.slug}/live`}
                className="rounded-lg inline-flex items-center gap-2 border border-court-green px-4 py-2 font-display text-xs font-semibold tracking-[0.2em] text-court-green uppercase transition-colors hover:bg-court-green hover:text-black"
              >
                <Radio aria-hidden="true" className="size-4" />
                Watch live
              </Link>
            )}
          </div>
        </div>
      </header>

      <div className="mx-auto grid max-w-[1600px] gap-12 px-4 py-14 sm:px-8 lg:grid-cols-12 lg:gap-16 lg:px-16 lg:py-20">
        <div className="min-w-0 space-y-16 lg:col-span-8">
          <section aria-labelledby="about-heading">
            <h2 id="about-heading" className="font-display text-xs font-medium tracking-[0.18em] text-muted uppercase">
              About
            </h2>
            <p className="mt-4 max-w-2xl text-lg leading-relaxed">{describeTournament(t)}</p>
            <dl className="mt-8 grid grid-cols-2 border-t border-l border-off-white/10 sm:grid-cols-3">
              {facts.map((f) => (
                <div key={f.label} className="flex flex-col-reverse border-r border-b border-off-white/10 p-5">
                  <dt className="mt-1 text-xs tracking-[0.2em] text-muted uppercase">{f.label}</dt>
                  <dd className="font-display font-semibold">{f.value}</dd>
                </div>
              ))}
            </dl>
          </section>

          <section aria-labelledby="events-heading">
            <h2 id="events-heading" className="font-display text-xs font-medium tracking-[0.18em] text-muted uppercase">
              Events
            </h2>
            <div className="mt-4 overflow-x-auto">
              <table className="w-full min-w-[28rem] text-left text-sm">
                <thead className="font-display text-xs tracking-[0.2em] text-muted uppercase">
                  <tr className="border-b border-off-white/10">
                    <th scope="col" className="py-3 pr-4 font-medium">Event</th>
                    <th scope="col" className="py-3 pr-4 font-medium">Age group</th>
                    <th scope="col" className="py-3 pr-4 font-medium">Format</th>
                    <th scope="col" className="py-3 text-right font-medium">Fee</th>
                  </tr>
                </thead>
                <tbody>
                  {t.events.map((e) => (
                    <tr key={eventLabel(e)} className="border-b border-off-white/10">
                      <th scope="row" className="py-4 pr-4 font-display font-semibold uppercase">{e.type}</th>
                      <td className="py-4 pr-4">{e.ageGroup}</td>
                      <td className="py-4 pr-4 text-muted">Knockout</td>
                      <td className="py-4 text-right">{formatInr(t.entryFee)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section aria-labelledby="schedule-heading">
            <h2 id="schedule-heading" className="font-display text-xs font-medium tracking-[0.18em] text-muted uppercase">
              Provisional schedule
            </h2>
            <ol className="mt-4 border-l border-off-white/15">
              {provisionalSchedule(t).map((d, i) => (
                <li key={d.date} className="relative py-4 pl-8">
                  <span aria-hidden="true" className="absolute top-[1.55rem] -left-[5px] size-[9px] rounded-full bg-court-green" />
                  <p className="font-display text-sm font-semibold tracking-[0.15em] text-court-green uppercase">
                    Day {i + 1} · {formatRange(d.date, d.date)}
                  </p>
                  <p className="mt-1">{d.label}</p>
                </li>
              ))}
            </ol>
            <p className="mt-2 text-sm text-muted">Match times are published once the draw is made.</p>
          </section>

          <section aria-labelledby="venue-heading">
            <h2 id="venue-heading" className="font-display text-xs font-medium tracking-[0.18em] text-muted uppercase">
              Venue
            </h2>
            <p className="mt-4 font-display text-2xl font-bold uppercase">{t.venue}</p>
            <p className="text-muted">{t.city}</p>
            <a
              href={mapsUrl(t)}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-4 inline-flex items-center gap-2 font-display text-xs font-semibold tracking-[0.2em] text-court-green uppercase underline-offset-4 hover:underline"
            >
              Open in Maps
              <ExternalLink aria-hidden="true" className="size-3.5" />
              <span className="sr-only">(opens in a new tab)</span>
            </a>
          </section>

          <section aria-labelledby="rules-heading">
            <h2 id="rules-heading" className="font-display text-xs font-medium tracking-[0.18em] text-muted uppercase">
              Rules
            </h2>
            <ul className="mt-4 space-y-3">
              {GENERAL_RULES.map((rule) => (
                <li key={rule} className="flex gap-3 leading-relaxed">
                  <span aria-hidden="true" className="mt-2.5 h-px w-4 shrink-0 bg-court-green" />
                  {rule}
                </li>
              ))}
            </ul>
          </section>
        </div>

        <div className="lg:col-span-4">
          <div className="lg:sticky lg:top-28">
            <RegistrationCard tournament={t} status={status} now={now} />
          </div>
        </div>
      </div>

      {related.length > 0 && (
        <section aria-labelledby="related-heading" className="border-t border-off-white/10">
          <div className="mx-auto max-w-[1600px] px-4 py-16 sm:px-8 lg:px-16 lg:py-24">
            <h2 id="related-heading" className="font-display text-2xl font-bold tracking-[-0.01em] uppercase sm:text-3xl">
              More tournaments
            </h2>
            <ul className="mt-8 border-t border-off-white/10">
              {related.map((o) => (
                <li key={o.slug}>
                  <TournamentRow tournament={o} status={getStatus(o, now)} now={now} />
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}

      {status === "open" && (
        <div className="fixed inset-x-0 bottom-0 z-30 flex items-center justify-between gap-4 border-t border-off-white/10 bg-charcoal px-4 py-3 sm:px-8 lg:hidden">
          <p className="font-display font-semibold">
            {formatInr(t.entryFee)} <span className="text-xs font-normal text-muted">/ event</span>
          </p>
          <Link
            href={registerHref(t)}
            className="rounded-lg inline-flex items-center gap-2 bg-court-green px-5 py-3 font-display text-xs font-semibold tracking-[0.14em] text-black uppercase"
          >
            Register
            <ArrowRight aria-hidden="true" className="size-4" />
          </Link>
        </div>
      )}
    </main>
  );
}
