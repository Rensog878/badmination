import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowRight } from "lucide-react";
import LiveDashboard from "@/components/live/LiveDashboard";
import { SITE } from "@/lib/content";
import { listTournaments } from "@/lib/data/tournaments";
import { ensureFeed, getSnapshot, liveAvailable } from "@/lib/live/store";
import { formatRange } from "@/lib/tournaments";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: `Live now | ${SITE.title}` };

/**
 * Every tournament with live coverage, on one page (target of the home strip's
 * "All courts" when more than one tournament is in play). Real tournaments come
 * before demo feeds. With exactly one, go straight to its dashboard.
 */
export default async function AllLivePage() {
  const now = Date.now();
  const live = (await listTournaments())
    .map((t) => ({ t, ...liveAvailable(t, now) }))
    .filter((x) => x.available)
    .sort((x, y) => Number(x.demo) - Number(y.demo));

  if (live.length === 1) redirect(`/tournaments/${live[0].t.slug}/live`);
  await Promise.all(live.map(({ t }) => ensureFeed(t)));

  return (
    <main id="main" className="min-h-svh bg-charcoal pt-28 pb-24 lg:pt-36">
      <div className="mx-auto max-w-[1600px] px-4 sm:px-8 lg:px-16">
        <h1 className="font-display text-[clamp(2.5rem,6vw,5rem)] leading-[0.92] font-bold tracking-[-0.03em] uppercase">
          Live now
        </h1>

        {live.length === 0 ? (
          <div className="mt-10 border border-off-white/15 p-8">
            <p className="text-lg">No matches are being played right now.</p>
            <Link href="/#tournaments" className="mt-4 inline-flex min-h-11 items-center gap-2 text-court-green hover:text-off-white">
              See upcoming tournaments
              <ArrowRight aria-hidden="true" className="size-4" />
            </Link>
          </div>
        ) : (
          <>
            {/* Jump links: a phone viewer can skip straight to their tournament. */}
            <nav aria-label="Live tournaments" className="mt-6 flex flex-wrap gap-2">
              {live.map(({ t }) => (
                <a
                  key={t.slug}
                  href={`#live-${t.slug}`}
                  className="inline-flex min-h-11 items-center rounded-full border border-off-white/15 px-4 text-sm text-muted hover:text-off-white"
                >
                  {t.name}
                </a>
              ))}
            </nav>
            {live.map(({ t }) => (
              <section key={t.slug} id={`live-${t.slug}`} aria-labelledby={`live-${t.slug}-h`} className="mt-16 scroll-mt-28">
                <div className="mb-8 flex flex-wrap items-end justify-between gap-4 border-b border-off-white/10 pb-4">
                  <div>
                    <h2 id={`live-${t.slug}-h`} className="font-display text-2xl font-bold uppercase sm:text-3xl">
                      {t.name}
                    </h2>
                    <p className="mt-1 text-sm text-muted">
                      {t.venue} · {formatRange(t.startDate, t.endDate)}
                    </p>
                  </div>
                  <Link
                    href={`/tournaments/${t.slug}/live`}
                    className="inline-flex min-h-11 items-center gap-2 font-display text-xs font-semibold tracking-[0.15em] text-court-green uppercase hover:text-off-white"
                  >
                    Open on its own
                    <ArrowRight aria-hidden="true" className="size-4" />
                  </Link>
                </div>
                <LiveDashboard initial={getSnapshot(t)} />
              </section>
            ))}
          </>
        )}
      </div>
    </main>
  );
}
