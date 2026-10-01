import { notFound } from "next/navigation";
import type { ReactNode } from "react";
import { logoutUmpire } from "@/app/umpire/actions";
import UmpireLogin from "@/components/umpire/UmpireLogin";
import { liveAvailable } from "@/lib/live/store";
import { getTournament } from "@/lib/tournaments";
import { isUmpire, umpireEnabled } from "@/lib/umpire-auth";

/** Umpire console shell; shared by the match list and the scoring pad. */
export default async function UmpireShell({ slug, next, children }: { slug: string; next: string; children: ReactNode }) {
  const t = getTournament(slug);
  if (!t) notFound();
  const signedIn = await isUmpire();
  return (
    <main id="main" className="min-h-svh bg-charcoal pt-28 pb-24 lg:pt-36">
      <div className="mx-auto max-w-5xl px-4 sm:px-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="font-display text-xs tracking-[0.32em] text-court-green uppercase">Umpire console</p>
            <h1 className="mt-3 font-display text-4xl font-bold tracking-[-0.02em] uppercase sm:text-5xl">{t.name}</h1>
          </div>
          {signedIn && (
            <form action={logoutUmpire}>
              <input type="hidden" name="slug" value={t.slug} />
              <button type="submit" className="font-display text-xs tracking-[0.2em] text-muted uppercase hover:text-off-white">
                Sign out
              </button>
            </form>
          )}
        </div>
        <div className="mt-10">
          {!umpireEnabled() ? (
            <p className="border border-off-white/15 p-6 text-muted">The umpire console is disabled. Set UMPIRE_TOKEN on the server to enable it.</p>
          ) : !liveAvailable(t, Date.now()).available ? (
            <p className="border border-off-white/15 p-6 text-muted">Live scoring opens when the tournament starts.</p>
          ) : !signedIn ? (
            <UmpireLogin next={next} />
          ) : (
            children
          )}
        </div>
      </div>
    </main>
  );
}

