import type { Metadata } from "next";
import { findTournament, listTournaments } from "@/lib/data/tournaments";
import Link from "next/link";
import { notFound } from "next/navigation";
import BackButton from "@/components/ui/BackButton";
import { ArrowRight, ExternalLink, Radio } from "lucide-react";
import RegistrationCard from "@/components/tournaments/RegistrationCard";
import StatusBadge from "@/components/tournaments/StatusBadge";
import TournamentBracket from "@/components/tournaments/TournamentBracket";
import TournamentRow from "@/components/tournaments/TournamentRow";
import CourtLines from "@/components/ui/CourtLines";
import { SITE } from "@/lib/content";
import { ensureFeed, getSnapshot, liveAvailable } from "@/lib/live/store";
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
  await ensureFeed(t);
  const snapshot = getSnapshot(t);
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
    <main id="main" className="theme-light min-h-svh bg-charcoal pb-[calc(7rem+env(safe-area-inset-bottom))] lg:pb-0">
      <header className="relative overflow-hidden border-b border-off-white/10 pt-28 pb-14 lg:pt-36 lg:pb-20">
        <CourtLines
          aria-hidden="true"
          className="pointer-events-none absolute top-1/2 -right-10 hidden w-[700px] max-w-none -translate-y-1/2 opacity-20 [mask-image:radial-gradient(ellipse_at_center,black_40%,transparent_80%)] sm:block text-off-white/20"
          strokeWidth={0.25}
        />
        <div className="relative mx-auto max-w-[1600px] px-4 sm:px-8 lg:px-16">
          <BackButton fallbackHref="/#tournaments" label="All tournaments" />
          <div className="mt-8 inline-flex items-center gap-2.5 rounded-full border border-court-green/25 bg-court-green/10 px-4 py-1.5 font-display text-xs font-semibold tracking-[0.18em] text-court-green uppercase backdrop-blur-md">
            <span aria-hidden="true" className="size-1.5 rounded-full bg-court-green shadow-[0_0_6px_rgba(16,185,129,0.8)]" />
            <span>{t.level}</span>
            <span aria-hidden="true" className="text-off-white/30">·</span>
            <span>{t.city}</span>
          </div>
          <h1 className="mt-4 max-w-4xl font-display text-[clamp(2.5rem,7vw,6.5rem)] leading-[0.92] font-black tracking-[-0.03em] uppercase">
            {t.name}
          </h1>
          <div className="mt-8 flex flex-wrap items-center gap-x-8 gap-y-3">
            <p className="font-display text-lg font-bold">{formatRange(t.startDate, t.endDate)}</p>
            <p className="text-muted">{t.venue}</p>
            <StatusBadge tournament={t} status={status} now={now} />
            {liveAvailable(t, now).available && (
              <Link
                href={`/tournaments/${t.slug}/live`}
                className="rounded-xl inline-flex items-center gap-2 border border-court-green/50 bg-court-green/10 px-5 py-2.5 font-display text-xs font-bold tracking-[0.2em] text-court-green uppercase shadow-[0_0_15px_rgba(16,185,129,0.15)] transition-all hover:bg-court-green hover:text-black hover:shadow-[0_0_25px_rgba(16,185,129,0.4)]"
              >
                <Radio aria-hidden="true" className="size-4 animate-pulse" />
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
                <div key={f.label} className="flex flex-col-reverse border-r border-b border-off-white/10 p-5 col-span-1 odd:last:col-span-2 sm:odd:last:col-span-1">
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
            {/* Phones: clean responsive card list without horizontal scroll */}
            <div className="mt-4 space-y-2.5 md:hidden">
              {t.events.map((e) => (
                <div key={eventLabel(e)} className="flex items-center justify-between rounded-xl border border-off-white/10 bg-off-white/[0.03] p-4">
                  <div>
                    <p className="font-display font-bold uppercase">{e.type}</p>
                    <p className="text-xs text-muted">{e.ageGroup} · Knockout</p>
                  </div>
                  <p className="font-display font-bold text-court-green">{formatInr(t.entryFee)}</p>
                </div>
              ))}
            </div>

            {/* Desktop: standard tabular view */}
            <div className="mt-4 hidden overflow-x-auto md:block">
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

          <TournamentBracket tournament={t} liveMatches={snapshot.matches} />

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
        <div className="fixed inset-x-0 bottom-0 z-30 flex items-center justify-between gap-3 border-t border-off-white/10 bg-charcoal/95 px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur-md sm:px-8 lg:hidden">
          <p className="font-display font-semibold">
            {formatInr(t.entryFee)} <span className="text-xs font-normal text-muted">/ event</span>
          </p>
          <Link
            href={registerHref(t)}
            className="rounded-lg inline-flex shrink-0 items-center gap-2 bg-court-green px-5 py-3 font-display text-xs font-semibold tracking-[0.14em] text-black uppercase"
          >
            Register
            <ArrowRight aria-hidden="true" className="size-4" />
          </Link>
        </div>
      )}
    </main>
  );
}
