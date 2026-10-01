import Link from "next/link";
import { removeMatchAction } from "@/app/admin/live-actions";
import MatchForm from "@/components/admin/MatchForm";
import { sideName } from "@/components/live/CourtCard";
import { listTournaments } from "@/lib/data/tournaments";
import { ensureFeed, getSnapshot } from "@/lib/live/store";
import { eventLabel, getStatus } from "@/lib/tournaments";

type PageProps = { searchParams: Promise<{ t?: string }> };

export default async function AdminLive({ searchParams }: PageProps) {
  const tournaments = await listTournaments();
  const now = Date.now();
  const { t: slug } = await searchParams;
  // Default to a live tournament, else the next one that isn't finished.
  const selected =
    tournaments.find((t) => t.slug === slug) ??
    tournaments.find((t) => getStatus(t, now) === "live") ??
    tournaments.find((t) => getStatus(t, now) !== "completed");

  if (!selected) return <p className="text-muted">No upcoming tournaments.</p>;
  await ensureFeed(selected);
  const snapshot = getSnapshot(selected);

  return (
    <div className="max-w-4xl">
      <h1 className="font-display text-4xl font-bold tracking-[-0.02em] uppercase">Live matches</h1>
      <form className="mt-6 flex items-end gap-3">
        <label className="flex-1 text-sm sm:flex-none">
          <span className="mb-1 block text-xs tracking-[0.18em] text-muted uppercase">Tournament</span>
          <select name="t" defaultValue={selected.slug} className="min-h-11 w-full rounded-lg border border-off-white/15 bg-charcoal px-3 py-2.5 sm:w-auto">
            {tournaments.map((t) => (
              <option key={t.slug} value={t.slug}>{t.name}</option>
            ))}
          </select>
        </label>
        <button type="submit" className="min-h-11 rounded-lg bg-off-white px-4 py-2.5 font-display text-xs font-semibold tracking-[0.18em] text-black uppercase">Show</button>
      </form>

      {snapshot.demo && (
        <p className="mt-6 border border-dashed border-court-green/50 px-4 py-3 text-sm">
          This tournament isn&apos;t live yet, so the public page shows the simulated demo feed. Matches added here belong to the real feed, which takes over once play starts.
        </p>
      )}

      <ul className="mt-8 divide-y divide-off-white/10 border-y border-off-white/10">
        {snapshot.matches.map((m) => (
          <li key={m.id} className="flex items-center justify-between gap-4 py-4 text-sm">
            <span>
              <span className="font-semibold">{sideName(m, "a")} <span className="text-muted">vs</span> {sideName(m, "b")}</span>
              <span className="block text-xs text-muted">
                {m.event} · {m.round} · {m.status}
                {m.court ? ` · court ${m.court}` : ""}
              </span>
            </span>
            {m.status === "scheduled" && !snapshot.demo && (
              <form action={removeMatchAction}>
                <input type="hidden" name="slug" value={selected.slug} />
                <input type="hidden" name="id" value={m.id} />
                <button type="submit" className="min-h-11 px-2 text-xs tracking-[0.18em] text-muted uppercase hover:text-off-white">Remove</button>
              </form>
            )}
          </li>
        ))}
        {snapshot.matches.length === 0 && <li className="py-4 text-sm text-muted">No matches yet.</li>}
      </ul>

      {!snapshot.demo && (
        <>
          <h2 className="mt-12 font-display text-xl font-bold uppercase">Add a match</h2>
          <div className="mt-6">
            <MatchForm slug={selected.slug} events={selected.events.map(eventLabel)} />
          </div>
        </>
      )}
      <p className="mt-10 text-sm text-muted">
        Umpires score from <Link href={`/umpire/${selected.slug}`} className="text-court-green underline underline-offset-4">/umpire/{selected.slug}</Link>.
      </p>
    </div>
  );
}
