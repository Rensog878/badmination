"use client";

import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import TournamentRow from "@/components/tournaments/TournamentRow";
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
    return tournaments.map((t) => ({ t, status: getStatus(t, now) }))
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

  const reset = () => {
    setAge("all");
    setLevel("all");
    setQuery("");
  };

  return (
    <div>
      <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
        <div role="group" aria-label="Tournament view" className="flex border-b border-off-white/10">
          {VIEWS.map((v) => (
            <button
              key={v.value}
              type="button"
              aria-pressed={view === v.value}
              onClick={() => setView(v.value)}
              className={`-mb-px border-b-2 px-4 py-3 font-display text-xs font-semibold tracking-[0.2em] uppercase transition-colors first:pl-0 ${
                view === v.value ? "border-court-green text-off-white" : "border-transparent text-muted hover:text-off-white"
              }`}
            >
              {v.label}
            </button>
          ))}
        </div>

        <div className="flex flex-col gap-3 sm:flex-row">
          <label className="relative block sm:w-64">
            <span className="sr-only">Search tournaments</span>
            <Search aria-hidden="true" className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted" />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search name or city"
              className="min-h-11 w-full rounded-lg border border-off-white/15 bg-transparent py-2.5 pr-3 pl-9 text-sm text-off-white placeholder:text-muted focus:border-court-green focus:outline-none"
            />
          </label>
          <label className="block">
            <span className="sr-only">Level</span>
            <select
              value={level}
              onChange={(e) => setLevel(e.target.value as TournamentLevel | "all")}
              className="min-h-11 w-full rounded-lg border border-off-white/15 bg-charcoal px-3 py-2.5 text-sm text-off-white focus:border-court-green focus:outline-none sm:w-44"
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

      <div role="group" aria-label="Age group" className="mt-6 flex flex-wrap gap-2">
        {AGE_GROUPS.map((a) => (
          <button
            key={a}
            type="button"
            aria-pressed={age === a}
            onClick={() => setAge(a)}
            className={`inline-flex min-h-11 items-center rounded-full px-3.5 py-2 font-display text-xs font-semibold tracking-[0.12em] uppercase transition-colors ${
              age === a ? "bg-off-white text-black" : "border border-off-white/15 text-muted hover:text-off-white"
            }`}
          >
            {a === "all" ? "All ages" : a}
          </button>
        ))}
      </div>

      <p aria-live="polite" className="mt-8 font-display text-xs tracking-[0.18em] text-muted uppercase">
        {`${results.length} tournament${results.length === 1 ? "" : "s"}`}
      </p>

      {results.length > 0 ? (
        <ul className="mt-2 border-t border-off-white/10">
          {results.map(({ t, status }) => (
            <li key={t.slug}>
              <TournamentRow tournament={t} status={status} now={now} />
            </li>
          ))}
        </ul>
      ) : (
        <div className="mt-2 border border-dashed border-off-white/15 px-6 py-16 text-center">
          <p className="font-display text-lg font-semibold uppercase">No tournaments match</p>
          <p className="mt-2 text-sm text-muted">Try another age group or level, or clear your search.</p>
          <button
            type="button"
            onClick={reset}
            className="rounded-lg mt-6 border border-court-green px-5 py-2.5 font-display text-xs font-semibold tracking-[0.2em] text-court-green uppercase hover:bg-court-green hover:text-black"
          >
            Clear filters
          </button>
        </div>
      )}
    </div>
  );
}
