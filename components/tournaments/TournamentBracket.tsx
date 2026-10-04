"use client";

import { useState } from "react";
import Link from "next/link";
import { Trophy, Crown, Radio, ArrowUpRight, Printer, Award } from "lucide-react";
import type { Tournament } from "@/lib/tournaments";
import type { LiveMatch } from "@/lib/live/types";

export interface BracketNode {
  id: string;
  round: "Quarter-Finals" | "Semi-Finals" | "Championship Final";
  court?: number | null;
  status?: "scheduled" | "live" | "finished";
  playerA: { name: string; seed?: string; score: number[]; winner?: boolean; school?: string };
  playerB: { name: string; seed?: string; score: number[]; winner?: boolean; school?: string };
}

const SAMPLE_BRACKETS: Record<string, BracketNode[]> = {
  singles: [
    // Quarter-Finals
    {
      id: "q1",
      round: "Quarter-Finals",
      court: 1,
      status: "finished",
      playerA: { name: "Viktor Axelsen", seed: "1", score: [21, 21], winner: true, school: "Denmark Acad." },
      playerB: { name: "K. Srikanth", score: [17, 19], school: "Gopichand Acad." },
    },
    {
      id: "q2",
      round: "Quarter-Finals",
      court: 2,
      status: "finished",
      playerA: { name: "Lakshya Sen", seed: "4", score: [21, 18, 21], winner: true, school: "Prakash Padukone Acad." },
      playerB: { name: "Lee Zii Jia", score: [19, 21, 16], school: "KL Sports School" },
    },
    {
      id: "q3",
      round: "Quarter-Finals",
      court: 3,
      status: "finished",
      playerA: { name: "Kodai Naraoka", seed: "3", score: [16, 21, 21], winner: true, school: "Tonami Club" },
      playerB: { name: "H.S. Prannoy", score: [21, 17, 18], school: "Gopichand Acad." },
    },
    {
      id: "q4",
      round: "Quarter-Finals",
      court: 4,
      status: "finished",
      playerA: { name: "Shi Yuqi", seed: "2", score: [21, 21], winner: true, school: "Jiangsu Club" },
      playerB: { name: "Anders Antonsen", score: [18, 15], school: "Aarhus Acad." },
    },
    // Semi-Finals
    {
      id: "s1",
      round: "Semi-Finals",
      court: 1,
      status: "finished",
      playerA: { name: "Viktor Axelsen", seed: "1", score: [21, 21], winner: true, school: "Denmark Acad." },
      playerB: { name: "Lakshya Sen", seed: "4", score: [19, 18], school: "Prakash Padukone Acad." },
    },
    {
      id: "s2",
      round: "Semi-Finals",
      court: 2,
      status: "finished",
      playerA: { name: "Shi Yuqi", seed: "2", score: [21, 22], winner: true, school: "Jiangsu Club" },
      playerB: { name: "Kodai Naraoka", seed: "3", score: [17, 20], school: "Tonami Club" },
    },
    // Championship Final
    {
      id: "f1",
      round: "Championship Final",
      court: 1,
      status: "finished",
      playerA: { name: "Viktor Axelsen", seed: "1", score: [21, 19, 21], winner: true, school: "Denmark Acad." },
      playerB: { name: "Shi Yuqi", seed: "2", score: [18, 21, 17], school: "Jiangsu Club" },
    },
  ],
  doubles: [
    // Quarter-Finals
    {
      id: "dq1",
      round: "Quarter-Finals",
      court: 1,
      status: "finished",
      playerA: { name: "Rankireddy / Shetty", seed: "1", score: [21, 21], winner: true },
      playerB: { name: "Chia / Soh", score: [18, 16] },
    },
    {
      id: "dq2",
      round: "Quarter-Finals",
      court: 2,
      status: "finished",
      playerA: { name: "Astrup / Rasmussen", seed: "3", score: [21, 22], winner: true },
      playerB: { name: "Hoki / Kobayashi", score: [19, 20] },
    },
    {
      id: "dq3",
      round: "Quarter-Finals",
      court: 3,
      status: "finished",
      playerA: { name: "Liang / Wang", seed: "2", score: [21, 21], winner: true },
      playerB: { name: "Kang / Seo", score: [17, 19] },
    },
    {
      id: "dq4",
      round: "Quarter-Finals",
      court: 4,
      status: "finished",
      playerA: { name: "Alfian / Ardianto", seed: "4", score: [21, 19, 21], winner: true },
      playerB: { name: "Carnando / Marthin", score: [18, 21, 16] },
    },
    // Semi-Finals
    {
      id: "ds1",
      round: "Semi-Finals",
      court: 1,
      status: "finished",
      playerA: { name: "Rankireddy / Shetty", seed: "1", score: [21, 21], winner: true },
      playerB: { name: "Astrup / Rasmussen", seed: "3", score: [16, 17] },
    },
    {
      id: "ds2",
      round: "Semi-Finals",
      court: 2,
      status: "finished",
      playerA: { name: "Liang / Wang", seed: "2", score: [21, 18, 21], winner: true },
      playerB: { name: "Alfian / Ardianto", seed: "4", score: [19, 21, 16] },
    },
    // Final
    {
      id: "df1",
      round: "Championship Final",
      court: 1,
      status: "finished",
      playerA: { name: "Rankireddy / Shetty", seed: "1", score: [21, 18, 21], winner: true },
      playerB: { name: "Liang / Wang", seed: "2", score: [19, 21, 18] },
    },
  ],
};

interface TournamentBracketProps {
  tournament: Tournament;
  liveMatches?: LiveMatch[];
}

export default function TournamentBracket({
  tournament,
  liveMatches = [],
}: TournamentBracketProps) {
  // Determine available categories from tournament.events or fallback to Singles / Doubles
  const hasDoublesEvent = tournament.events?.some((e) => e.type === "Doubles") ?? true;
  const hasSinglesEvent = tournament.events?.some((e) => e.type === "Singles") ?? true;

  const [category, setCategory] = useState<"singles" | "doubles">(
    hasSinglesEvent ? "singles" : "doubles"
  );
  const [mobileRound, setMobileRound] = useState<"quarters" | "semis" | "final">("final");

  // Filter live matches for current category
  const categoryMatches = liveMatches.filter((m) => {
    const isDoubles = m.event.toLowerCase().includes("doubles");
    return category === "doubles" ? isDoubles : !isDoubles;
  });

  const hasRealBracket = categoryMatches.some((m) =>
    ["quarter", "semi", "final"].some((r) => m.round.toLowerCase().includes(r))
  );

  let quarters: BracketNode[] = [];
  let semis: BracketNode[] = [];
  let finalMatch: BracketNode | undefined = undefined;

  const mapLiveMatch = (m: LiveMatch): BracketNode => ({
    id: m.id,
    round: m.round.toLowerCase().includes("quarter")
      ? "Quarter-Finals"
      : m.round.toLowerCase().includes("semi")
      ? "Semi-Finals"
      : "Championship Final",
    court: m.court,
    status: m.status,
    playerA: {
      name: m.sides.a.join(" / "),
      score: m.games.map((g) => g.a),
      winner: m.winner === "a",
    },
    playerB: {
      name: m.sides.b.join(" / "),
      score: m.games.map((g) => g.b),
      winner: m.winner === "b",
    },
  });

  if (hasRealBracket) {
    quarters = categoryMatches
      .filter((m) => m.round.toLowerCase().includes("quarter"))
      .map(mapLiveMatch);
    semis = categoryMatches
      .filter((m) => m.round.toLowerCase().includes("semi"))
      .map(mapLiveMatch);
    finalMatch = categoryMatches
      .filter(
        (m) =>
          m.round.toLowerCase().includes("final") &&
          !m.round.toLowerCase().includes("semi") &&
          !m.round.toLowerCase().includes("quarter")
      )
      .map(mapLiveMatch)[0];
  }

  // Fallback to sample bracket so the draw is always a complete 8-player championship projection
  const fallbackMatches = SAMPLE_BRACKETS[category] ?? SAMPLE_BRACKETS.singles;
  if (quarters.length === 0) quarters = fallbackMatches.filter((m) => m.round === "Quarter-Finals");
  if (semis.length === 0) semis = fallbackMatches.filter((m) => m.round === "Semi-Finals");
  if (!finalMatch) finalMatch = fallbackMatches.find((m) => m.round === "Championship Final");

  // Determine champion name if final is complete
  const championName =
    finalMatch?.playerA.winner
      ? finalMatch.playerA.name
      : finalMatch?.playerB.winner
      ? finalMatch.playerB.name
      : null;

  return (
    <section aria-labelledby="bracket-heading" className="mt-16 border-t border-off-white/10 pt-16">
      {/* Section Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-court-green/30 bg-court-green/10 px-3.5 py-1 text-xs font-bold tracking-[0.16em] text-court-green uppercase">
            <Trophy className="size-3.5" />
            <span>Interactive Tournament Draw</span>
          </div>
          <h2 id="bracket-heading" className="mt-3 font-display text-2xl font-black uppercase sm:text-3xl">
            Championship Bracket Tree
          </h2>
          <p className="mt-1 text-sm text-muted">
            Live knockout tree with real-time court radar and path to the trophy.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Category Switcher */}
          {(hasSinglesEvent && hasDoublesEvent) && (
            <div className="flex rounded-xl border border-off-white/15 bg-black/40 p-1">
              <button
                type="button"
                onClick={() => setCategory("singles")}
                className={`rounded-lg px-4 py-2 font-display text-xs font-bold tracking-[0.14em] uppercase transition-all ${
                  category === "singles"
                    ? "bg-court-green text-black shadow-sm"
                    : "text-muted hover:text-off-white"
                }`}
              >
                Singles Draw
              </button>
              <button
                type="button"
                onClick={() => setCategory("doubles")}
                className={`rounded-lg px-4 py-2 font-display text-xs font-bold tracking-[0.14em] uppercase transition-all ${
                  category === "doubles"
                    ? "bg-court-green text-black shadow-sm"
                    : "text-muted hover:text-off-white"
                }`}
              >
                Doubles Draw
              </button>
            </div>
          )}

          <Link
            href={`/tournaments/${tournament.slug}/print`}
            target="_blank"
            className="inline-flex min-h-10 items-center gap-1.5 rounded-xl border border-off-white/15 bg-black/40 px-3.5 py-1.5 text-xs font-semibold text-muted hover:border-court-green/50 hover:text-court-green transition-all"
            title="Print Official Tournament Draw Sheet"
          >
            <Printer className="size-3.5" />
            <span className="font-display tracking-wider uppercase text-[11px] font-bold">Print Draw</span>
          </Link>
        </div>
      </div>

      {/* Champion Gold Celebration Banner */}
      {championName && (
        <div className="mt-6 rounded-2xl border border-amber-400/40 bg-gradient-to-r from-amber-500/15 via-yellow-500/10 to-amber-500/15 p-4 shadow-[0_0_30px_rgba(234,179,8,0.15)] backdrop-blur-md">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-amber-400 to-yellow-600 text-black shadow-md">
                <Crown className="size-5" />
              </span>
              <div>
                <span className="font-display text-[10px] font-black tracking-widest text-amber-400 uppercase">
                  Reigning Champion · {category === "singles" ? "Singles" : "Doubles"}
                </span>
                <p className="font-display text-base font-black text-off-white sm:text-lg">
                  {championName}
                </p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <div className="inline-flex items-center gap-2 rounded-full border border-amber-400/30 bg-amber-400/10 px-3 py-1 font-display text-xs font-bold text-amber-300 uppercase">
                <span>Gold Medal Winner</span>
              </div>

              <Link
                href={`/tournaments/${tournament.slug}/certificate?name=${encodeURIComponent(
                  championName
                )}&type=winner&event=${encodeURIComponent(
                  category === "singles" ? "Open Singles" : "Open Doubles"
                )}`}
                target="_blank"
                className="inline-flex items-center gap-1.5 rounded-full border border-amber-400/60 bg-amber-400/20 px-3.5 py-1 font-display text-xs font-bold text-amber-300 uppercase hover:bg-amber-400 hover:text-black transition-all shadow-[0_0_12px_rgba(234,179,8,0.3)]"
                title="Generate Official Championship Certificate"
              >
                <Award className="size-3.5" />
                <span>Champion Certificate</span>
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Mobile Round Selector (< md) */}
      <div className="mt-6 md:hidden">
        <div className="grid grid-cols-3 gap-1 rounded-xl border border-off-white/15 bg-black/40 p-1 font-display text-xs font-bold uppercase">
          <button
            type="button"
            onClick={() => setMobileRound("quarters")}
            className={`rounded-lg py-2 text-center transition-all ${
              mobileRound === "quarters" ? "bg-court-green text-black shadow-sm" : "text-muted"
            }`}
          >
            Quarters ({quarters.length})
          </button>
          <button
            type="button"
            onClick={() => setMobileRound("semis")}
            className={`rounded-lg py-2 text-center transition-all ${
              mobileRound === "semis" ? "bg-court-green text-black shadow-sm" : "text-muted"
            }`}
          >
            Semis ({semis.length})
          </button>
          <button
            type="button"
            onClick={() => setMobileRound("final")}
            className={`rounded-lg py-2 text-center transition-all ${
              mobileRound === "final" ? "bg-court-green text-black shadow-sm" : "text-muted"
            }`}
          >
            Final
          </button>
        </div>

        <div className="mt-4 space-y-3">
          {mobileRound === "quarters" && (
            <>
              <p className="text-xs font-semibold tracking-wider uppercase text-muted">
                Quarter-Finals · Best of 3 Games
              </p>
              {quarters.map((m) => (
                <MatchCard key={m.id} match={m} tournamentSlug={tournament.slug} />
              ))}
            </>
          )}

          {mobileRound === "semis" && (
            <>
              <p className="text-xs font-semibold tracking-wider uppercase text-muted">
                Semi-Finals · Podium Deciders
              </p>
              {semis.map((m) => (
                <MatchCard key={m.id} match={m} tournamentSlug={tournament.slug} />
              ))}
            </>
          )}

          {mobileRound === "final" && finalMatch && (
            <div className="space-y-3 pt-2">
              <div className="inline-flex items-center gap-1.5 rounded-full border border-amber-400/40 bg-amber-400/15 px-3 py-1 font-display text-[10px] font-bold text-amber-300 uppercase shadow-[0_0_12px_rgba(234,179,8,0.3)]">
                <Trophy className="size-3" />
                <span>Championship Decider</span>
              </div>
              <MatchCard match={finalMatch} isFinal tournamentSlug={tournament.slug} />
            </div>
          )}
        </div>
      </div>

      {/* Desktop Visual Bracket Tree with Connected SVG Branches (md+) */}
      <div className="mt-8 hidden overflow-x-auto pb-4 md:block [scrollbar-width:thin]">
        <div className="min-w-[920px]">
          {/* Stage Headers */}
          <div className="grid grid-cols-[1fr_40px_1fr_40px_1fr] gap-0 border-b border-off-white/10 pb-3">
            <div className="flex items-center justify-between pr-4">
              <span className="font-display text-xs font-bold tracking-[0.18em] text-muted uppercase">
                Quarter-Finals (8 Players)
              </span>
              <span className="text-[11px] font-medium text-muted">Best of 3</span>
            </div>
            <div aria-hidden="true" />
            <div className="flex items-center justify-between px-2">
              <span className="font-display text-xs font-bold tracking-[0.18em] text-muted uppercase">
                Semi-Finals
              </span>
              <span className="text-[11px] font-medium text-muted">Penultimate</span>
            </div>
            <div aria-hidden="true" />
            <div className="flex items-center justify-between pl-4">
              <span className="font-display text-xs font-bold tracking-[0.18em] text-amber-400 uppercase">
                Championship Final
              </span>
              <span className="text-[11px] font-bold text-amber-400 uppercase">Gold Match</span>
            </div>
          </div>

          {/* Bracket Tree Row */}
          <div className="mt-6 grid grid-cols-[1fr_40px_1fr_40px_1fr] items-stretch gap-0">
            {/* Column 1: Quarter Finals (4 matches in 2 pairs) */}
            <div className="flex flex-col justify-between gap-6 py-2">
              {/* Pair 1: Q1 and Q2 */}
              <div className="flex flex-col gap-4">
                <MatchCard match={quarters[0]} tournamentSlug={tournament.slug} />
                <MatchCard match={quarters[1]} tournamentSlug={tournament.slug} />
              </div>
              {/* Pair 2: Q3 and Q4 */}
              <div className="flex flex-col gap-4">
                <MatchCard match={quarters[2]} tournamentSlug={tournament.slug} />
                <MatchCard match={quarters[3]} tournamentSlug={tournament.slug} />
              </div>
            </div>

            {/* SVG Connector 1: Quarters ➔ Semis */}
            <div className="flex flex-col justify-between py-2">
              {/* Top Pair Fork: Q1/Q2 -> S1 */}
              <div className="h-[48%] w-full">
                <BracketConnectorFork
                  topActive={quarters[0]?.playerA.winner || quarters[0]?.playerB.winner}
                  bottomActive={quarters[1]?.playerA.winner || quarters[1]?.playerB.winner}
                  outActive={Boolean(semis[0])}
                />
              </div>
              {/* Bottom Pair Fork: Q3/Q4 -> S2 */}
              <div className="h-[48%] w-full">
                <BracketConnectorFork
                  topActive={quarters[2]?.playerA.winner || quarters[2]?.playerB.winner}
                  bottomActive={quarters[3]?.playerA.winner || quarters[3]?.playerB.winner}
                  outActive={Boolean(semis[1])}
                />
              </div>
            </div>

            {/* Column 2: Semi Finals (2 matches) */}
            <div className="flex flex-col justify-around gap-12 py-2">
              <MatchCard match={semis[0]} tournamentSlug={tournament.slug} />
              <MatchCard match={semis[1]} tournamentSlug={tournament.slug} />
            </div>

            {/* SVG Connector 2: Semis ➔ Final */}
            <div className="flex h-full w-full flex-col justify-center py-2">
              <div className="h-[75%] w-full">
                <BracketConnectorFork
                  topActive={semis[0]?.playerA.winner || semis[0]?.playerB.winner}
                  bottomActive={semis[1]?.playerA.winner || semis[1]?.playerB.winner}
                  outActive={Boolean(finalMatch)}
                />
              </div>
            </div>

            {/* Column 3: Championship Final (1 match) */}
            <div className="flex flex-col justify-center py-2">
              {finalMatch && (
                <div className="relative">
                  <div className="absolute -top-7 left-1/2 -translate-x-1/2 inline-flex items-center gap-1.5 rounded-full border border-amber-400/40 bg-amber-400/15 px-3 py-0.5 font-display text-[10px] font-black text-amber-300 uppercase shadow-[0_0_15px_rgba(234,179,8,0.3)] whitespace-nowrap">
                    <Crown className="size-3 text-amber-400" />
                    <span>Gold Medal Match</span>
                  </div>
                  <MatchCard match={finalMatch} isFinal tournamentSlug={tournament.slug} />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/**
 * Clean SVG Connector Fork with 2 Inputs (Top at 25%, Bottom at 75%) merging into 1 Output at 50%.
 * Using non-scaling-stroke so line weights stay crisp and uniform regardless of responsive dimensions.
 */
function BracketConnectorFork({
  topActive,
  bottomActive,
  outActive,
}: {
  topActive?: boolean;
  bottomActive?: boolean;
  outActive?: boolean;
}) {
  const activeColor = "#10b981"; // court-green

  return (
    <svg
      className="h-full w-full overflow-visible text-muted"
      viewBox="0 0 40 100"
      preserveAspectRatio="none"
      fill="none"
      aria-hidden="true"
    >
      {/* Top branch */}
      <path
        d="M 0,25 H 20 V 50"
        stroke={topActive ? activeColor : "currentColor"}
        strokeOpacity={topActive ? 1 : 0.35}
        strokeWidth={topActive ? "2.5" : "1.5"}
        vectorEffect="non-scaling-stroke"
      />
      {/* Bottom branch */}
      <path
        d="M 0,75 H 20 V 50"
        stroke={bottomActive ? activeColor : "currentColor"}
        strokeOpacity={bottomActive ? 1 : 0.35}
        strokeWidth={bottomActive ? "2.5" : "1.5"}
        vectorEffect="non-scaling-stroke"
      />
      {/* Stem into next round */}
      <path
        d="M 20,50 H 40"
        stroke={outActive ? activeColor : "currentColor"}
        strokeOpacity={outActive ? 1 : 0.35}
        strokeWidth={outActive ? "2.5" : "1.5"}
        vectorEffect="non-scaling-stroke"
      />
      {/* Junction center node */}
      <circle
        cx="20"
        cy="50"
        r="3"
        fill={outActive ? activeColor : "currentColor"}
        fillOpacity={outActive ? 1 : 0.45}
        className={outActive ? "drop-shadow-[0_0_6px_rgba(16,185,129,0.8)]" : ""}
      />
    </svg>
  );
}

function MatchCard({
  match,
  isFinal,
  tournamentSlug,
}: {
  match?: BracketNode;
  isFinal?: boolean;
  tournamentSlug: string;
}) {
  if (!match) {
    return (
      <div className="rounded-xl border border-dashed border-off-white/10 bg-black/20 p-4 text-center">
        <span className="font-display text-xs text-muted uppercase">TBD vs TBD</span>
      </div>
    );
  }

  const isLive = match.status === "live";
  const href = `/tournaments/${tournamentSlug}/live/${match.id}`;

  return (
    <article
      className={`group relative rounded-xl border p-3.5 transition-all duration-300 ${
        isFinal
          ? "border-amber-400/50 bg-black/85 shadow-[0_0_30px_rgba(234,179,8,0.18)] hover:border-amber-400"
          : isLive
          ? "border-court-green/60 bg-black/80 shadow-[0_0_20px_rgba(16,185,129,0.25)] hover:border-court-green"
          : "border-off-white/10 bg-black/50 hover:border-court-green/40 hover:bg-black/70"
      }`}
    >
      {/* Card Header: Court & Status */}
      <div className="mb-2.5 flex items-center justify-between text-[10px]">
        <div className="flex items-center gap-1.5 font-display font-bold uppercase tracking-wider">
          {isLive ? (
            <span className="inline-flex items-center gap-1 rounded-md bg-court-green/20 px-1.5 py-0.5 text-court-green animate-pulse">
              <Radio className="size-2.5" />
              <span>LIVE · CT {match.court ?? 1}</span>
            </span>
          ) : match.court ? (
            <span className="text-muted">Court {match.court}</span>
          ) : (
            <span className="text-muted">{match.round}</span>
          )}
        </div>

        {/* Live Scoreboard Link */}
        <Link
          href={href}
          className="inline-flex items-center gap-0.5 text-muted hover:text-court-green transition-colors"
          title="Open live scoreboard"
        >
          <span className="text-[10px] font-semibold uppercase tracking-wider">Match</span>
          <ArrowUpRight className="size-3 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
        </Link>
      </div>

      {/* Players & Scores */}
      <div className="space-y-2">
        <PlayerRow player={match.playerA} isFinal={isFinal} />
        <div className="h-px w-full bg-off-white/10" />
        <PlayerRow player={match.playerB} isFinal={isFinal} />
      </div>
    </article>
  );
}

function PlayerRow({
  player,
  isFinal,
}: {
  player: BracketNode["playerA"];
  isFinal?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-2">
      <div className="flex min-w-0 items-center gap-2">
        {player.seed && (
          <span className="rounded bg-off-white/10 px-1.5 py-0.5 font-mono text-[10px] font-semibold text-muted">
            {player.seed}
          </span>
        )}
        <div className="min-w-0">
          <span
            className={`block truncate font-display text-xs uppercase ${
              player.winner
                ? isFinal
                  ? "font-black text-amber-300"
                  : "font-black text-court-green"
                : "font-medium text-off-white/80"
            }`}
          >
            {player.name}
          </span>
          {player.school && (
            <span className="block truncate text-[10px] text-muted">
              {player.school}
            </span>
          )}
        </div>
      </div>
      <div className="flex items-center gap-1.5 font-display text-xs font-bold tabular-nums">
        {player.score.map((s, i) => (
          <span
            key={i}
            className={`rounded px-1.5 py-0.5 ${
              player.winner
                ? isFinal
                  ? "bg-amber-400/20 text-amber-300 font-black"
                  : "bg-court-green/20 text-court-green font-black"
                : "bg-off-white/5 text-muted"
            }`}
          >
            {s}
          </span>
        ))}
      </div>
    </div>
  );
}
