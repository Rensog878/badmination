import { gamesWon, type Side } from "@/lib/live/scoring";
import type { LiveMatch, LiveSnapshot } from "@/lib/live/types";

/** Compact live match for the home page "Live now" strip (kept small: it is polled). */
export interface LiveStripMatch {
  id: string;
  slug: string;
  tournament: string;
  demo: boolean;
  court: number | null;
  event: string;
  names: Record<Side, string>;
  /** Points in the game in progress. */
  points: Record<Side, number>;
  games: Record<Side, number>;
  server: Side;
}

export function stripMatches(snapshot: LiveSnapshot, tournament: string): LiveStripMatch[] {
  return snapshot.matches
    .filter((m: LiveMatch) => m.status === "live")
    .sort((a, b) => (a.court ?? 99) - (b.court ?? 99))
    .map((m) => {
      const current = m.games[m.games.length - 1] ?? { a: 0, b: 0 };
      return {
        id: m.id,
        slug: snapshot.slug,
        tournament,
        demo: snapshot.demo,
        court: m.court,
        event: m.event,
        names: { a: m.sides.a.join(" / "), b: m.sides.b.join(" / ") },
        points: { a: current.a, b: current.b },
        games: { a: gamesWon(m.games, "a"), b: gamesWon(m.games, "b") },
        server: m.server,
      };
    });
}
