import Link from "next/link";
import MatchManager from "@/components/admin/MatchManager";
import { listTournaments } from "@/lib/data/tournaments";
import { ensureFeed, getSnapshot } from "@/lib/live/store";
import { eventLabel, getStatus } from "@/lib/tournaments";
import { ExternalLink, Radio, Tv } from "lucide-react";

type PageProps = { searchParams: Promise<{ t?: string }> };

export default async function AdminLive({ searchParams }: PageProps) {
  const tournaments = await listTournaments();
  const now = Date.now();
  const { t: slug } = await searchParams;

  // Default to a live tournament, else the next one that isn't finished.
  const selected =
    tournaments.find((t) => t.slug === slug) ??
    tournaments.find((t) => getStatus(t, now) === "live") ??
    tournaments.find((t) => getStatus(t, now) !== "completed") ??
    tournaments[0];

  if (!selected) return <p className="text-muted">No upcoming tournaments.</p>;

  // Ensure real feed is loaded so all admin actions persist directly to database
  await ensureFeed(selected, { forceReal: true });
  const snapshot = getSnapshot(selected);

  return (
    <div className="max-w-5xl space-y-8">
      {/* Header & Quick Links */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-court-green/30 bg-court-green/10 px-3 py-1 text-xs font-bold tracking-[0.16em] text-court-green uppercase">
            <Radio className="size-3 animate-pulse" />
            <span>Tournament Operations Console</span>
          </div>
          <h1 className="mt-3 font-display text-3xl font-black tracking-tight uppercase sm:text-4xl">
            Live Matches & Draws
          </h1>
          <p className="mt-1 text-sm text-muted">
            Manage real-time matches, court assignments, point-by-point scores, public address announcements, and TV stadium feeds.
          </p>
        </div>

        <div className="flex flex-wrap w-full sm:w-auto items-center gap-2">
          <Link
            href={`/tournaments/${selected.slug}/tv`}
            target="_blank"
            className="flex-1 sm:flex-initial inline-flex min-h-11 items-center justify-center gap-1.5 rounded-xl border border-amber-500/40 bg-amber-500/10 px-3.5 py-2 font-display text-xs font-bold tracking-[0.12em] text-amber-300 uppercase transition-all hover:bg-amber-400 hover:text-black"
          >
            <Tv className="size-3.5" />
            <span>Arena TV</span>
          </Link>
          <Link
            href={`/tournaments/${selected.slug}/live`}
            target="_blank"
            className="flex-1 sm:flex-initial inline-flex min-h-11 items-center justify-center gap-1.5 rounded-xl border border-white/15 bg-white/5 px-3.5 py-2 font-display text-xs font-bold tracking-[0.12em] text-off-white uppercase hover:border-court-green/50 hover:bg-court-green/10"
          >
            <span>Scoreboard</span>
            <ExternalLink className="size-3.5" />
          </Link>
          <Link
            href={`/umpire/${selected.slug}`}
            target="_blank"
            className="flex-1 sm:flex-initial inline-flex min-h-11 items-center justify-center gap-1.5 rounded-xl border border-court-green/40 bg-court-green/10 px-3.5 py-2 font-display text-xs font-bold tracking-[0.12em] text-court-green uppercase hover:bg-court-green hover:text-black"
          >
            <span>Umpire Pad</span>
            <ExternalLink className="size-3.5" />
          </Link>
        </div>
      </div>

      {/* Tournament Selector */}
      <form className="flex flex-col gap-3 rounded-2xl border border-white/10 bg-white/[0.02] p-4 sm:flex-row sm:items-end">
        <label className="flex-1 text-sm">
          <span className="mb-1 block font-display text-xs font-bold tracking-[0.16em] text-muted uppercase">
            Active Tournament
          </span>
          <select
            name="t"
            defaultValue={selected.slug}
            className="min-h-11 w-full rounded-xl border border-white/15 bg-charcoal px-3 py-2.5 text-sm font-medium text-off-white focus:border-court-green focus:outline-none"
          >
            {tournaments.map((t) => (
              <option key={t.slug} value={t.slug}>
                {t.name} ({t.city})
              </option>
            ))}
          </select>
        </label>
        <button
          type="submit"
          className="min-h-11 rounded-xl bg-off-white px-6 py-2.5 font-display text-xs font-bold tracking-[0.16em] text-black uppercase transition-all hover:bg-court-green"
        >
          Switch Tournament
        </button>
      </form>

      {/* Complete Match & Bracket Manager */}
      <MatchManager
        slug={selected.slug}
        tournamentName={selected.name}
        events={selected.events.map(eventLabel)}
        matches={snapshot.matches}
        isDemo={snapshot.demo}
        activeAnnouncement={snapshot.activeAnnouncement ?? null}
        courts={snapshot.courts}
      />
    </div>
  );
}
