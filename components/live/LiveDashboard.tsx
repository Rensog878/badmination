"use client";

import { useEffect, useRef, useState } from "react";
import CourtCard, { sideName } from "@/components/live/CourtCard";
import { useLiveFeed, type Connection } from "@/components/live/useLiveFeed";
import type { LiveMatch, LiveSnapshot } from "@/lib/live/types";

const UP_NEXT_COUNT = 6;

const scoreLine = (m: LiveMatch) =>
  m.games
    .filter((g) => g.a + g.b > 0)
    .map((g) => (m.winner === "b" ? `${g.b}–${g.a}` : `${g.a}–${g.b}`))
    .join(", ");

const CONNECTION_LABEL: Record<Connection, string> = {
  connecting: "Connecting",
  live: "Live",
  reconnecting: "Reconnecting…",
};

export default function LiveDashboard({ initial }: { initial: LiveSnapshot }) {
  const { snapshot, connection } = useLiveFeed(initial.slug, initial);
  const [announcement, setAnnouncement] = useState("");
  const seenFinished = useRef(new Set(initial.matches.filter((m) => m.status === "finished").map((m) => m.id)));

  const live = snapshot.matches.filter((m) => m.status === "live");
  const scheduled = snapshot.matches.filter((m) => m.status === "scheduled");
  const finished = snapshot.matches
    .filter((m) => m.status === "finished")
    .sort((a, b) => (b.finishedAt ?? 0) - (a.finishedAt ?? 0));

  // Announce results (not every rally) to screen readers.
  useEffect(() => {
    const fresh = finished.filter((m) => !seenFinished.current.has(m.id));
    if (fresh.length === 0) return;
    fresh.forEach((m) => seenFinished.current.add(m.id));
    const m = fresh[0];
    if (m.winner) {
      const loser = m.winner === "a" ? "b" : "a";
      setAnnouncement(`Result: ${sideName(m, m.winner)} beat ${sideName(m, loser)}, ${scoreLine(m)}, ${m.event} ${m.round}.`);
    }
  }, [finished]);

  const stats = [
    { label: "On court", value: live.length },
    { label: "Completed", value: finished.length },
    { label: "Up next", value: scheduled.length },
  ];

  return (
    <div>
      {snapshot.demo && (
        <p role="note" className="mb-8 border border-dashed border-court-green/50 px-5 py-3 text-sm text-off-white">
          <span className="font-display font-semibold tracking-[0.15em] text-court-green uppercase">Demo feed · </span>
          Matches, names and scores are simulated to preview live coverage. Real scores appear here during the tournament.
        </p>
      )}

      <div className="flex flex-wrap items-end justify-between gap-6">
        <dl className="flex gap-10">
          {stats.map((s) => (
            <div key={s.label} className="flex flex-col-reverse">
              <dt className="mt-1 text-[0.65rem] tracking-[0.25em] text-muted uppercase">{s.label}</dt>
              <dd className="font-display text-4xl font-bold tabular-nums">{s.value}</dd>
            </div>
          ))}
        </dl>
        <p className="flex items-center gap-2 font-display text-xs font-semibold tracking-[0.2em] uppercase" aria-live="polite">
          <span aria-hidden="true" className={`size-2 rounded-full ${connection === "live" ? "bg-court-green" : "bg-muted"}`} />
          {CONNECTION_LABEL[connection]}
        </p>
      </div>

      <section aria-labelledby="courts-heading" className="mt-10">
        <h2 id="courts-heading" className="sr-only">Courts</h2>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: snapshot.courts }, (_, i) => i + 1).map((court) => (
            <CourtCard key={court} court={court} match={live.find((m) => m.court === court)} />
          ))}
        </div>
      </section>

      <div className="mt-14 grid gap-12 lg:grid-cols-2">
        <section aria-labelledby="next-heading">
          <h2 id="next-heading" className="font-display text-xs font-medium tracking-[0.32em] text-muted uppercase">
            Up next
          </h2>
          {scheduled.length === 0 ? (
            <p className="mt-4 text-sm text-muted">No matches waiting.</p>
          ) : (
            <ol className="mt-4 divide-y divide-off-white/10 border-y border-off-white/10">
              {scheduled.slice(0, UP_NEXT_COUNT).map((m, i) => (
                <li key={m.id} className="grid grid-cols-[2rem_1fr] gap-3 py-3.5 text-sm">
                  <span className="font-display text-muted tabular-nums">{String(i + 1).padStart(2, "0")}</span>
                  <span>
                    <span className="font-semibold">{sideName(m, "a")}</span>
                    <span className="text-muted"> vs </span>
                    <span className="font-semibold">{sideName(m, "b")}</span>
                    <span className="block text-xs text-muted">
                      {m.event} · {m.round}
                    </span>
                  </span>
                </li>
              ))}
            </ol>
          )}
        </section>

        <section aria-labelledby="results-heading">
          <h2 id="results-heading" className="font-display text-xs font-medium tracking-[0.32em] text-muted uppercase">
            Latest results
          </h2>
          {finished.length === 0 ? (
            <p className="mt-4 text-sm text-muted">No completed matches yet.</p>
          ) : (
            <ol className="mt-4 divide-y divide-off-white/10 border-y border-off-white/10">
              {finished.map((m) => {
                const winner = m.winner ?? "a";
                const loser = winner === "a" ? "b" : "a";
                return (
                  <li key={m.id} className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 py-3.5 text-sm">
                    <span>
                      <span className="font-semibold text-court-green">{sideName(m, winner)}</span>
                      <span className="text-muted"> def. </span>
                      <span>{sideName(m, loser)}</span>
                      <span className="block text-xs text-muted">
                        {m.event} · {m.round}
                      </span>
                    </span>
                    <span className="font-display tabular-nums">{scoreLine(m)}</span>
                  </li>
                );
              })}
            </ol>
          )}
        </section>
      </div>

      <p aria-live="polite" className="sr-only">
        {announcement}
      </p>
    </div>
  );
}
