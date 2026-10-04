import type { Metadata } from "next";
import { findTournament } from "@/lib/data/tournaments";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Tv, Printer } from "lucide-react";
import BackButton from "@/components/ui/BackButton";
import LiveDashboard from "@/components/live/LiveDashboard";
import { SITE } from "@/lib/content";
import { ensureFeed, getSnapshot, liveAvailable } from "@/lib/live/store";
import { formatRange } from "@/lib/tournaments";

export const dynamic = "force-dynamic";

type PageProps = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const t = await findTournament((await params).slug);
  return t ? { title: `Live · ${t.name} | ${SITE.title}` } : {};
}

export default async function LivePage({ params }: PageProps) {
  const t = await findTournament((await params).slug);
  if (!t) notFound();
  await ensureFeed(t);
  const { available } = liveAvailable(t, Date.now());

  return (
    <main id="main" className="min-h-svh bg-charcoal pt-28 pb-24 lg:pt-36">
      <div className="mx-auto max-w-[1600px] px-4 sm:px-8 lg:px-16">
        <BackButton fallbackHref={`/tournaments/${t.slug}`} label={t.name} />
        <div className="mt-8 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="font-display text-[clamp(2.5rem,6vw,5rem)] leading-[0.92] font-bold tracking-[-0.03em] uppercase">
              Live
            </h1>
            <p className="mt-1 text-muted">
              {t.name} · {t.venue} · {formatRange(t.startDate, t.endDate)}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Link
              href={`/tournaments/${t.slug}/print`}
              target="_blank"
              className="inline-flex items-center gap-2 rounded-xl border border-off-white/20 bg-off-white/5 px-4 py-2.5 font-display text-xs font-bold tracking-[0.16em] text-off-white uppercase hover:border-court-green/50 hover:text-court-green transition-all"
              title="Print Order of Play & Draw Sheet"
            >
              <Printer className="size-4" />
              <span>Print Draws / Schedule</span>
            </Link>

            {available && (
              <Link
                href={`/tournaments/${t.slug}/tv`}
                target="_blank"
                className="btn-shimmer inline-flex items-center gap-2 rounded-xl border border-court-green/40 bg-court-green/10 px-4 py-2.5 font-display text-xs font-bold tracking-[0.16em] text-court-green uppercase hover:bg-court-green hover:text-black transition-all shadow-md shadow-court-green/10"
              >
                <Tv className="size-4" />
                <span>Stadium TV Mode</span>
              </Link>
            )}
          </div>
        </div>

        <div className="mt-10">
          {available ? (
            <LiveDashboard initial={getSnapshot(t)} tournamentName={t.name} />
          ) : (
            <div className="border border-off-white/15 p-8">
              <p className="text-lg">Live coverage starts when play begins on {formatRange(t.startDate, t.startDate)}.</p>
              <p className="mt-2 text-muted">Courts, scores and results will update here in real time.</p>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
