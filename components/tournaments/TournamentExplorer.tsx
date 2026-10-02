"use client";

import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import TournamentRow from "@/components/tournaments/TournamentRow";
import { useIndicator } from "@/components/ui/useIndicator";
import {
  dayStart,
  getStatus,
  type AgeGroup,
  type Tournament,
  type TournamentLevel,
  type TournamentStatus,
} from "@/lib/tournaments";

type View = "upcoming" | "open" | "results";

const VIEWS: { value: View; label: string }[] = [
  { value: "upcoming", label: "Upcoming" },
  { value: "open", label: "Open for entry" },
  { value: "results", label: "Results" },
];
const AGE_GROUPS: (AgeGroup | "all")[] = ["all", "U13", "U15", "U17", "Open"];
const LEVELS: (TournamentLevel | "all")[] = ["all", "Club", "District", "State", "Open"];

function inView(view: View, status: TournamentStatus) {
  if (view === "results") return status === "completed";
  if (view === "open") return status === "open";
  return status !== "completed";
}

interface TournamentExplorerProps {
  /** Reference time from the server render, so status is identical on server and client. */
  now: number;
  tournaments: Tournament[];
}

export default function TournamentExplorer({ now, tournaments }: TournamentExplorerProps) {
  const [view, setView] = useState<View>("upcoming");
  const [age, setAge] = useState<AgeGroup | "all">("all");
  const [level, setLevel] = useState<TournamentLevel | "all">("all");
  const [query, setQuery] = useState("");

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    return tournaments
      .map((t) => ({ t, status: getStatus(t, now) }))
      .filter(({ status }) => inView(view, status))
      .filter(({ t }) => age === "all" || t.events.some((e) => e.ageGroup === age))
      .filter(({ t }) => level === "all" || t.level === level)
      .filter(({ t }) => !q || `${t.name} ${t.city} ${t.venue}`.toLowerCase().includes(q))
      .sort((a, b) =>
        view === "results"
          ? dayStart(b.t.startDate) - dayStart(a.t.startDate)
          : dayStart(a.t.startDate) - dayStart(b.t.startDate),
      );
  }, [tournaments, now, view, age, level, query]);

  const tabs = useIndicator<HTMLDivElement>(view);
  const pills = useIndicator<HTMLDivElement>(age, true);
  // Changes whenever the filters do, so the rows replay their entrance.
  const listKey = `${view}|${age}|${level}|${query.trim().toLowerCase()}`;

  const reset = () => {
    setAge("all");
    setLevel("all");
    setQuery("");
  };

  return (
    <div>
      <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
        <div ref={tabs.ref} role="group" aria-label="Tournament view" className="relative flex border-b border-off-white/10">
          {VIEWS.map((v) => (
            <button
              key={v.value}
              data-indicator={v.value}
              type="button"
              aria-pressed={view === v.value}
              onClick={() => setView(v.value)}
              className={`min-h-11 px-4 py-3 font-display text-xs font-semibold tracking-[0.2em] uppercase transition-colors first:pl-0 ${
                view === v.value ? "text-off-white" : "text-muted hover:text-off-white"
              } ${view === v.value && !tabs.ready ? "-mb-px border-b-2 border-court-green" : ""}`}
            >
              {v.label}
            </button>
          ))}
          <span aria-hidden="true" style={tabs.style} className="indicator absolute -bottom-px left-0 h-0.5 bg-court-green" />
        </div>

        <div className="flex flex-col gap-3 sm:flex-row">
          <label className="relative block sm:w-72">
            <span className="sr-only">Search tournaments</span>
            <Search
              aria-hidden="true"
              className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted"
            />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search name, city or venue"
              className="min-h-11 w-full rounded-xl border border-off-white/15 bg-black/10 py-2.5 pr-3 pl-10 text-sm text-off-white placeholder:text-muted focus:border-court-green focus:ring-1 focus:ring-court-green/50 focus:outline-none transition-all"
            />
          </label>
          <label className="block">
            <span className="sr-only">Level</span>
            <select
              value={level}
              onChange={(e) => setLevel(e.target.value as TournamentLevel | "all")}
              className="min-h-11 w-full rounded-xl border border-off-white/15 bg-charcoal px-3.5 py-2.5 text-sm text-off-white focus:border-court-green focus:ring-1 focus:ring-court-green/50 focus:outline-none transition-all sm:w-44"
            >
              {LEVELS.map((l) => (
                <option key={l} value={l}>
                  {l === "all" ? "All levels" : `${l} level`}
                </option>
              ))}
            </select>
          </label>
        </div>
      </div>

      <div ref={pills.ref} role="group" aria-label="Age group" className="relative mt-6 flex flex-wrap gap-2">
        <span aria-hidden="true" style={pills.style} className="indicator absolute top-0 left-0 rounded-full bg-off-white" />
        {AGE_GROUPS.map((a) => (
          <button
            key={a}
            data-indicator={a}
            type="button"
            aria-pressed={age === a}
            onClick={() => setAge(a)}
            className={`relative inline-flex min-h-11 items-center rounded-full border px-4 py-2 font-display text-xs font-bold tracking-[0.14em] uppercase transition-[color,border-color,transform] duration-300 active:scale-95 ${
              age === a ? "border-transparent text-black" : "border-off-white/15 text-muted hover:border-off-white/35 hover:text-off-white"
            } ${age === a && !pills.ready ? "bg-off-white" : ""}`}
          >
            {a === "all" ? "All ages" : a}
          </button>
        ))}
      </div>

      <p aria-live="polite" className="mt-8 font-display text-xs font-semibold tracking-[0.2em] text-muted uppercase">
        {`${results.length} tournament${results.length === 1 ? "" : "s"}`}
      </p>

      {results.length > 0 ? (
        <ul key={listKey} className="mt-2 border-t border-off-white/10">
          {results.map(({ t, status }, i) => (
            <li key={t.slug} className="row-in" style={{ animationDelay: `${Math.min(i, 8) * 40}ms` }}>
              <TournamentRow tournament={t} status={status} now={now} />
            </li>
          ))}
        </ul>
      ) : (
        <div className="mt-4 rounded-2xl border border-dashed border-off-white/15 bg-off-white/[0.02] px-6 py-16 text-center">
          <p className="font-display text-lg font-bold uppercase">No tournaments match</p>
          <p className="mt-2 text-sm text-muted">Try another age group or level, or clear your search.</p>
          <button
            type="button"
            onClick={reset}
            className="rounded-xl mt-6 border border-court-green bg-court-green/10 px-6 py-3 font-display text-xs font-bold tracking-[0.2em] text-court-green uppercase transition-all hover:bg-court-green hover:text-black"
          >
            Clear filters
          </button>
        </div>
      )}
    </div>
  );
}
