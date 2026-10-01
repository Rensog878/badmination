import type { Metadata } from "next";
import { findTournament, listTournaments } from "@/lib/data/tournaments";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import RegistrationForm from "@/components/registration/RegistrationForm";
import StatusBadge from "@/components/tournaments/StatusBadge";
import { SITE } from "@/lib/content";
import { daysToClose, formatInr, formatRange, getStatus } from "@/lib/tournaments";

export const revalidate = 3600;

type PageProps = { params: Promise<{ slug: string }> };

export async function generateStaticParams() {
  return (await listTournaments()).map((t) => ({ slug: t.slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const t = await findTournament((await params).slug);
  if (!t) return {};
  return { title: `Register · ${t.name} | ${SITE.title}`, robots: { index: false } };
}

export default async function RegisterPage({ params }: PageProps) {
  const t = await findTournament((await params).slug);
  if (!t) notFound();
  const now = Date.now();
  const status = getStatus(t, now);
  const open = status === "open";

  return (
    <main id="main" className="theme-light min-h-svh bg-charcoal pt-28 pb-24 lg:pt-36">
      <div className="mx-auto max-w-[1600px] px-4 sm:px-8 lg:px-16">
        <Link
          href={`/tournaments/${t.slug}`}
          className="inline-flex items-center gap-2 font-display text-xs tracking-[0.15em] text-muted uppercase transition-colors hover:text-off-white"
        >
          <ArrowLeft aria-hidden="true" className="size-4" />
          {t.name}
        </Link>
        <h1 className="mt-8 font-display text-[clamp(2.5rem,6vw,5rem)] leading-[0.92] font-bold tracking-[-0.03em] uppercase">
          Enter the draw
        </h1>

        <div className="mt-12 grid gap-12 lg:grid-cols-12 lg:gap-16">
          <div className="min-w-0 lg:col-span-8">
            {open ? (
              <RegistrationForm tournament={t} />
            ) : (
              <div className="border border-off-white/15 p-8">
                <StatusBadge tournament={t} status={status} now={now} />
                <p className="mt-4 text-lg">Online entry isn&apos;t available for this tournament right now.</p>
                <Link href={`/tournaments/${t.slug}`} className="mt-6 inline-block text-court-green underline underline-offset-4">
                  Back to tournament details
                </Link>
              </div>
            )}
          </div>

          <aside aria-label="Tournament summary" className="lg:col-span-4">
            <div className="border border-off-white/10 bg-black p-6 sm:p-8 lg:sticky lg:top-28">
              <p className="font-display text-xs tracking-[0.18em] text-court-green uppercase">{t.level} · {t.city}</p>
              <p className="mt-3 font-display text-2xl font-bold uppercase">{t.name}</p>
              <dl className="mt-6 space-y-3 border-t border-off-white/10 pt-6 text-sm">
                <div className="flex justify-between gap-4">
                  <dt className="text-muted">Dates</dt>
                  <dd>{formatRange(t.startDate, t.endDate)}</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-muted">Venue</dt>
                  <dd className="text-right">{t.venue}</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-muted">Entry fee</dt>
                  <dd>{formatInr(t.entryFee)} / event</dd>
                </div>
                {open && (
                  <div className="flex justify-between gap-4">
                    <dt className="text-muted">Entries close</dt>
                    <dd>in {daysToClose(t, now)} days</dd>
                  </div>
                )}
              </dl>
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}
