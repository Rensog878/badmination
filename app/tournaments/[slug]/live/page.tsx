import type { Metadata } from "next";
import { findTournament } from "@/lib/data/tournaments";
import { notFound } from "next/navigation";
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
        <div className="mt-8 flex flex-wrap items-end gap-x-6 gap-y-3">
          <h1 className="font-display text-[clamp(2.5rem,6vw,5rem)] leading-[0.92] font-bold tracking-[-0.03em] uppercase">
            Live
          </h1>
          <p className="pb-2 text-muted">
            {t.name} · {t.venue} · {formatRange(t.startDate, t.endDate)}
          </p>
        </div>

        <div className="mt-10">
          {available ? (
            <LiveDashboard initial={getSnapshot(t)} />
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
