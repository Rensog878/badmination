"use client";

import { useState } from "react";
import { Trophy } from "lucide-react";
import type { Tournament } from "@/lib/tournaments";
import type { LiveMatch } from "@/lib/live/types";

interface MatchNode {
  id: string;
  round: "Quarter-Finals" | "Semi-Finals" | "Championship Final";
  playerA: { name: string; seed?: string; score: number[]; winner?: boolean };
  playerB: { name: string; seed?: string; score: number[]; winner?: boolean };
}

const SAMPLE_BRACKET: Record<string, MatchNode[]> = {
  singles: [
    // Quarter-Finals
    {
      id: "q1",
      round: "Quarter-Finals",
      playerA: { name: "Viktor A.", seed: "1", score: [21, 21], winner: true },
      playerB: { name: "K. Srikanth", score: [17, 19] },
    },
    {
      id: "q2",
      round: "Quarter-Finals",
      playerA: { name: "L. Sen", seed: "4", score: [21, 18, 21], winner: true },
      playerB: { name: "Lee Z. J.", score: [19, 21, 16] },
    },
    {
      id: "q3",
      round: "Quarter-Finals",
      playerA: { name: "K. Naraoka", seed: "3", score: [16, 21, 21], winner: true },
      playerB: { name: "Prannoy H.S.", score: [21, 17, 18] },
    },
    {
      id: "q4",
      round: "Quarter-Finals",
      playerA: { name: "Shi Y.Q.", seed: "2", score: [21, 21], winner: true },
      playerB: { name: "A. Antonsen", score: [18, 15] },
    },
    // Semi-Finals
    {
      id: "s1",
      round: "Semi-Finals",
      playerA: { name: "Viktor A.", seed: "1", score: [21, 21], winner: true },
      playerB: { name: "L. Sen", seed: "4", score: [19, 18] },
    },
    {
      id: "s2",
      round: "Semi-Finals",
      playerA: { name: "Shi Y.Q.", seed: "2", score: [21, 22], winner: true },
      playerB: { name: "K. Naraoka", seed: "3", score: [17, 20] },
    },
    // Final
    {
      id: "f1",
      round: "Championship Final",
      playerA: { name: "Viktor A.", seed: "1", score: [21, 19, 21], winner: true },
      playerB: { name: "Shi Y.Q.", seed: "2", score: [18, 21, 17] },
    },
  ],
  doubles: [
    // Quarter-Finals
    {
      id: "dq1",
      round: "Quarter-Finals",
      playerA: { name: "Rankireddy / Shetty", seed: "1", score: [21, 21], winner: true },
      playerB: { name: "Chia / Soh", score: [18, 16] },
    },
    {
      id: "dq2",
      round: "Quarter-Finals",
      playerA: { name: "Astrup / Rasmussen", seed: "3", score: [21, 22], winner: true },
      playerB: { name: "Hoki / Kobayashi", score: [19, 20] },
    },
    {
      id: "dq3",
      round: "Quarter-Finals",
      playerA: { name: "Liang / Wang", seed: "2", score: [21, 21], winner: true },
      playerB: { name: "Kang / Seo", score: [17, 19] },
    },
    {
      id: "dq4",
      round: "Quarter-Finals",
      playerA: { name: "Alfian / Ardianto", seed: "4", score: [21, 19, 21], winner: true },
      playerB: { name: "Carnando / Marthin", score: [18, 21, 16] },
    },
    // Semi-Finals
    {
      id: "ds1",
      round: "Semi-Finals",
      playerA: { name: "Rankireddy / Shetty", seed: "1", score: [21, 21], winner: true },
      playerB: { name: "Astrup / Rasmussen", seed: "3", score: [16, 17] },
    },
    {
      id: "ds2",
      round: "Semi-Finals",
      playerA: { name: "Liang / Wang", seed: "2", score: [21, 18, 21], winner: true },
      playerB: { name: "Alfian / Ardianto", seed: "4", score: [19, 21, 16] },
    },
    // Final
    {
      id: "df1",
      round: "Championship Final",
      playerA: { name: "Rankireddy / Shetty", seed: "1", score: [21, 18, 21], winner: true },
      playerB: { name: "Liang / Wang", seed: "2", score: [19, 21, 18] },
    },
  ],
};

export default function TournamentBracket({
  tournament,
  liveMatches = [],
}: {
  tournament: Tournament;
  liveMatches?: LiveMatch[];
}) {
  const [category, setCategory] = useState<"singles" | "doubles">("singles");

  // Check if live/stored matches exist for this tournament and category
  const categoryMatches = liveMatches.filter((m) => {
    const isDoubles = m.event.toLowerCase().includes("doubles");
    return category === "doubles" ? isDoubles : !isDoubles;
  });

  const hasRealBracket = categoryMatches.some((m) =>
    ["quarter", "semi", "final"].some((r) => m.round.toLowerCase().includes(r))
  );

  let quarters: MatchNode[] = [];
  let semis: MatchNode[] = [];
  let finalMatch: MatchNode | undefined = undefined;

  if (hasRealBracket) {
    const mapMatch = (m: LiveMatch): MatchNode => ({
      id: m.id,
      round: m.round.toLowerCase().includes("quarter")
        ? "Quarter-Finals"
        : m.round.toLowerCase().includes("semi")
        ? "Semi-Finals"
        : "Championship Final",
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

    quarters = categoryMatches
      .filter((m) => m.round.toLowerCase().includes("quarter"))
      .map(mapMatch);
    semis = categoryMatches
      .filter((m) => m.round.toLowerCase().includes("semi"))
      .map(mapMatch);
    finalMatch = categoryMatches
      .filter((m) => m.round.toLowerCase().includes("final") && !m.round.toLowerCase().includes("semi") && !m.round.toLowerCase().includes("quarter"))
      .map(mapMatch)[0];
  }

  // Fallback to SAMPLE_BRACKET for any missing rounds so draw is always populated
  const fallbackMatches = SAMPLE_BRACKET[category] ?? [];
  if (quarters.length === 0) quarters = fallbackMatches.filter((m) => m.round === "Quarter-Finals");
  if (semis.length === 0) semis = fallbackMatches.filter((m) => m.round === "Semi-Finals");
  if (!finalMatch) finalMatch = fallbackMatches.find((m) => m.round === "Championship Final");

  return (
    <section aria-labelledby="bracket-heading" className="mt-16 border-t border-off-white/10 pt-16">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-court-green/30 bg-court-green/10 px-3.5 py-1 text-xs font-bold tracking-[0.16em] text-court-green uppercase">
            <Trophy className="size-3.5" />
            <span>Interactive Tournament Draw</span>
          </div>
          <h2 id="bracket-heading" className="mt-3 font-display text-2xl font-black uppercase sm:text-3xl">
            Championship Bracket
          </h2>
          <p className="mt-1 text-sm text-muted">
            Live knockout projection and match progression tree for {tournament.name}.
          </p>
        </div>

        {/* Category switcher */}
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
            Singles
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
            Doubles
          </button>
        </div>
      </div>

      {/* Bracket Tree */}
      <div className="mt-8 overflow-x-auto pb-4 [scrollbar-width:thin]">
        <div className="grid min-w-[760px] grid-cols-3 gap-8">
          {/* Quarter Finals */}
          <div>
            <div className="mb-4 flex items-center justify-between border-b border-off-white/10 pb-2">
              <span className="font-display text-xs font-bold tracking-[0.18em] text-muted uppercase">
                Quarter-Finals
              </span>
              <span className="text-[11px] font-medium text-muted">Best of 3</span>
            </div>
            <div className="space-y-4">
              {quarters.map((m) => (
                <MatchCard key={m.id} match={m} />
              ))}
            </div>
          </div>

          {/* Semi Finals */}
          <div>
            <div className="mb-4 flex items-center justify-between border-b border-off-white/10 pb-2">
              <span className="font-display text-xs font-bold tracking-[0.18em] text-muted uppercase">
                Semi-Finals
              </span>
              <span className="text-[11px] font-medium text-muted">Penultimate</span>
            </div>
            <div className="flex h-[calc(100%-2.5rem)] flex-col justify-around gap-6">
              {semis.map((m) => (
                <MatchCard key={m.id} match={m} />
              ))}
            </div>
          </div>

          {/* Final & Champion */}
          <div>
            <div className="mb-4 flex items-center justify-between border-b border-off-white/10 pb-2">
              <span className="font-display text-xs font-bold tracking-[0.18em] text-court-green uppercase">
                Championship Final
              </span>
              <span className="text-[11px] font-bold text-court-green uppercase">Gold Medal</span>
            </div>
            <div className="flex h-[calc(100%-2.5rem)] flex-col justify-center">
              {finalMatch && (
                <div className="relative">
                  <div className="absolute -top-10 left-1/2 -translate-x-1/2 inline-flex items-center gap-1.5 rounded-full border border-court-green/40 bg-court-green/15 px-3 py-1 font-display text-[10px] font-bold text-court-green uppercase shadow-[0_0_12px_rgba(16,185,129,0.3)]">
                    <Trophy className="size-3" />
                    <span>Tournament Champion</span>
                  </div>
                  <MatchCard match={finalMatch} isFinal />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function MatchCard({ match, isFinal }: { match: MatchNode; isFinal?: boolean }) {
  return (
    <article
      className={`rounded-xl border p-3.5 transition-all duration-300 ${
        isFinal
          ? "border-court-green/50 bg-black/80 shadow-[0_0_25px_rgba(16,185,129,0.15)]"
          : "border-off-white/10 bg-black/50 hover:border-court-green/40"
      }`}
    >
      <div className="space-y-2">
        <PlayerRow player={match.playerA} />
        <div className="h-px w-full bg-off-white/10" />
        <PlayerRow player={match.playerB} />
      </div>
    </article>
  );
}

function PlayerRow({ player }: { player: MatchNode["playerA"] }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <div className="flex min-w-0 items-center gap-2">
        {player.seed && (
          <span className="rounded bg-off-white/10 px-1.5 py-0.5 font-mono text-[10px] font-semibold text-muted">
            {player.seed}
          </span>
        )}
        <span
          className={`truncate font-display text-xs uppercase ${
            player.winner
              ? "font-extrabold text-court-green"
              : "font-medium text-off-white/80"
          }`}
        >
          {player.name}
        </span>
      </div>
      <div className="flex items-center gap-1.5 font-display text-xs font-bold tabular-nums">
        {player.score.map((s, i) => (
          <span
            key={i}
            className={`rounded px-1.5 py-0.5 ${
              player.winner
                ? "bg-court-green/15 text-court-green font-black"
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
