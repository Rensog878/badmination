"use client";

import { useMemo, useState } from "react";
import { Search, Trophy, Users } from "lucide-react";

export type InstitutionType = "all" | "school" | "college" | "academy";

export interface InstitutionStanding {
  rank: number;
  name: string;
  type: "school" | "college" | "academy";
  city: string;
  gold: number;
  silver: number;
  bronze: number;
  athletes: number;
  points: number; // Gold * 5 + Silver * 3 + Bronze * 1
}

const SAMPLE_STANDINGS: InstitutionStanding[] = [
  {
    rank: 1,
    name: "Delhi Public School (Bangalore South)",
    type: "school",
    city: "Bengaluru",
    gold: 5,
    silver: 3,
    bronze: 2,
    athletes: 24,
    points: 36,
  },
  {
    rank: 2,
    name: "Gopichand Badminton Academy",
    type: "academy",
    city: "Hyderabad",
    gold: 4,
    silver: 4,
    bronze: 3,
    athletes: 18,
    points: 35,
  },
  {
    rank: 3,
    name: "Padukone-Dravid Centre for Sports Excellence",
    type: "academy",
    city: "Bengaluru",
    gold: 4,
    silver: 2,
    bronze: 4,
    athletes: 20,
    points: 30,
  },
  {
    rank: 4,
    name: "National Public School (Indiranagar)",
    type: "school",
    city: "Bengaluru",
    gold: 3,
    silver: 2,
    bronze: 1,
    athletes: 14,
    points: 22,
  },
  {
    rank: 5,
    name: "Jain University Sports Academy",
    type: "college",
    city: "Bengaluru",
    gold: 2,
    silver: 3,
    bronze: 2,
    athletes: 16,
    points: 21,
  },
  {
    rank: 6,
    name: "Bishop Cotton Boys' School",
    type: "school",
    city: "Bengaluru",
    gold: 2,
    silver: 1,
    bronze: 3,
    athletes: 12,
    points: 16,
  },
  {
    rank: 7,
    name: "St. Joseph's University",
    type: "college",
    city: "Bengaluru",
    gold: 1,
    silver: 2,
    bronze: 2,
    athletes: 10,
    points: 13,
  },
  {
    rank: 8,
    name: "Tattva Badminton Foundation",
    type: "academy",
    city: "Mysuru",
    gold: 1,
    silver: 1,
    bronze: 2,
    athletes: 8,
    points: 10,
  },
];

export default function SchoolLeaderboard({
  tournamentName,
  standings = SAMPLE_STANDINGS,
}: {
  tournamentName?: string;
  standings?: InstitutionStanding[];
}) {
  const [filterType, setFilterType] = useState<InstitutionType>("all");
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    return standings
      .filter((s) => (filterType === "all" ? true : s.type === filterType))
      .filter((s) => (search.trim() ? s.name.toLowerCase().includes(search.toLowerCase()) || s.city.toLowerCase().includes(search.toLowerCase()) : true))
      .sort((a, b) => b.points - a.points || b.gold - a.gold);
  }, [standings, filterType, search]);

  const topThree = filtered.slice(0, 3);

  return (
    <section className="mt-14 rounded-3xl border border-off-white/15 bg-charcoal/80 p-6 sm:p-10 backdrop-blur-xl">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between border-b border-off-white/10 pb-6">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-court-green/40 bg-court-green/10 px-3 py-1 font-display text-xs font-bold tracking-[0.16em] text-court-green uppercase">
            <Trophy className="size-3.5" />
            <span>Inter-School & Academy Championship</span>
          </div>
          <h2 className="mt-3 font-display text-2xl font-bold uppercase tracking-tight text-off-white sm:text-3xl">
            Institutional Medal Tally & Points Table
          </h2>
          <p className="mt-1 text-xs text-muted sm:text-sm">
            {tournamentName ? `Official standings for ${tournamentName}.` : "Live team rankings across all junior & collegiate divisions."}{" "}
            Gold (5 pts) · Silver (3 pts) · Bronze (1 pt).
          </p>
        </div>

        {/* Search */}
        <div className="relative w-full md:w-72">
          <Search className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search school or academy..."
            className="w-full rounded-xl border border-off-white/15 bg-black/60 py-2 pl-10 pr-4 text-xs text-off-white placeholder:text-muted focus:border-court-green focus:outline-none transition-colors"
          />
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="mt-6 flex flex-wrap items-center gap-2">
        {(
          [
            { id: "all", label: "All Institutions" },
            { id: "school", label: "Schools (K-12)" },
            { id: "college", label: "Colleges / Universities" },
            { id: "academy", label: "Junior Academies" },
          ] as const
        ).map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setFilterType(tab.id)}
            className={`rounded-lg px-3.5 py-1.5 font-display text-xs font-semibold uppercase tracking-wider transition-colors ${
              filterType === tab.id
                ? "bg-court-green text-black font-bold shadow-md shadow-court-green/20"
                : "border border-off-white/15 bg-off-white/5 text-muted hover:border-court-green/50 hover:text-off-white"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Podium Cards for Top 3 */}
      {topThree.length >= 3 && !search && (
        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          {/* 2nd Place */}
          <div className="order-2 sm:order-1 flex flex-col justify-between rounded-2xl border border-slate-400/30 bg-gradient-to-b from-slate-400/10 to-transparent p-5 text-center">
            <div>
              <span className="inline-flex size-9 items-center justify-center rounded-full bg-slate-400/20 text-slate-300 font-bold font-display text-sm">
                2
              </span>
              <p className="mt-3 font-display text-base font-bold text-off-white line-clamp-1">{topThree[1].name}</p>
              <p className="text-[11px] text-muted">{topThree[1].city}</p>
            </div>
            <div className="mt-4 flex items-center justify-center gap-3 border-t border-off-white/10 pt-3 text-xs">
              <span>🥇 {topThree[1].gold}</span>
              <span>🥈 {topThree[1].silver}</span>
              <span>🥉 {topThree[1].bronze}</span>
              <span className="font-display font-bold text-slate-300">{topThree[1].points} pts</span>
            </div>
          </div>

          {/* 1st Place - Champion */}
          <div className="order-1 sm:order-2 flex flex-col justify-between rounded-2xl border-2 border-amber-400/60 bg-gradient-to-b from-amber-400/15 via-black/40 to-transparent p-6 text-center shadow-xl shadow-amber-400/10 -mt-2">
            <div>
              <span className="inline-flex size-11 items-center justify-center rounded-full bg-amber-400/20 text-amber-300 font-black font-display text-lg shadow-[0_0_15px_rgba(251,191,36,0.3)]">
                👑 1
              </span>
              <span className="mt-2 block font-display text-[10px] font-bold tracking-[0.2em] text-amber-300 uppercase">
                Championship Leader
              </span>
              <p className="mt-1 font-display text-lg font-black text-off-white">{topThree[0].name}</p>
              <p className="text-xs text-muted">{topThree[0].city}</p>
            </div>
            <div className="mt-5 flex items-center justify-center gap-4 border-t border-amber-400/20 pt-3 text-sm">
              <span>🥇 <strong className="text-off-white">{topThree[0].gold}</strong></span>
              <span>🥈 <strong className="text-off-white">{topThree[0].silver}</strong></span>
              <span>🥉 <strong className="text-off-white">{topThree[0].bronze}</strong></span>
              <span className="font-display font-black text-amber-300 text-base">{topThree[0].points} pts</span>
            </div>
          </div>

          {/* 3rd Place */}
          <div className="order-3 flex flex-col justify-between rounded-2xl border border-amber-700/40 bg-gradient-to-b from-amber-700/10 to-transparent p-5 text-center">
            <div>
              <span className="inline-flex size-9 items-center justify-center rounded-full bg-amber-700/20 text-amber-500 font-bold font-display text-sm">
                3
              </span>
              <p className="mt-3 font-display text-base font-bold text-off-white line-clamp-1">{topThree[2].name}</p>
              <p className="text-[11px] text-muted">{topThree[2].city}</p>
            </div>
            <div className="mt-4 flex items-center justify-center gap-3 border-t border-off-white/10 pt-3 text-xs">
              <span>🥇 {topThree[2].gold}</span>
              <span>🥈 {topThree[2].silver}</span>
              <span>🥉 {topThree[2].bronze}</span>
              <span className="font-display font-bold text-amber-500">{topThree[2].points} pts</span>
            </div>
          </div>
        </div>
      )}

      {/* Full Leaderboard Table (Mobile card-friendly & Desktop table) */}
      <div className="mt-8 overflow-hidden rounded-2xl border border-off-white/10 bg-black">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-off-white/10 bg-off-white/[0.04] font-display text-xs tracking-wider text-muted uppercase">
              <tr>
                <th scope="col" className="px-5 py-3.5 text-center w-14">#</th>
                <th scope="col" className="px-5 py-3.5">Institution / Academy</th>
                <th scope="col" className="px-4 py-3.5 text-center">Athletes</th>
                <th scope="col" className="px-3 py-3.5 text-center">🥇 Gold</th>
                <th scope="col" className="px-3 py-3.5 text-center">🥈 Silver</th>
                <th scope="col" className="px-3 py-3.5 text-center">🥉 Bronze</th>
                <th scope="col" className="px-5 py-3.5 text-right">Points</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-off-white/10 font-normal">
              {filtered.map((inst, idx) => {
                const rankNumber = idx + 1;
                return (
                  <tr key={inst.name} className="hover:bg-off-white/[0.04] transition-colors">
                    <td className="px-5 py-4 text-center font-display font-bold text-muted">
                      {rankNumber === 1 ? (
                        <span className="text-amber-400">1</span>
                      ) : rankNumber === 2 ? (
                        <span className="text-slate-300">2</span>
                      ) : rankNumber === 3 ? (
                        <span className="text-amber-600">3</span>
                      ) : (
                        rankNumber
                      )}
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex flex-col">
                        <span className="font-display font-bold text-off-white">{inst.name}</span>
                        <div className="flex items-center gap-2 text-xs text-muted">
                          <span>{inst.city}</span>
                          <span>·</span>
                          <span className="uppercase text-[10px] tracking-wider text-court-green font-semibold">
                            {inst.type}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-center text-xs text-muted">
                      <span className="inline-flex items-center gap-1">
                        <Users className="size-3" />
                        {inst.athletes}
                      </span>
                    </td>
                    <td className="px-3 py-4 text-center font-bold text-amber-300">{inst.gold}</td>
                    <td className="px-3 py-4 text-center font-bold text-slate-300">{inst.silver}</td>
                    <td className="px-3 py-4 text-center font-bold text-amber-600">{inst.bronze}</td>
                    <td className="px-5 py-4 text-right font-display text-base font-black text-court-green">
                      {inst.points}
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-muted">
                    No institutions found matching &quot;{search}&quot;.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
