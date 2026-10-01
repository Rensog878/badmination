import type { GameScore, Side } from "@/lib/live/scoring";

export type MatchStatus = "scheduled" | "live" | "finished";

export interface LiveMatch {
  id: string;
  event: string;
  round: string;
  court: number | null;
  /** One entry per player (two for doubles). */
  sides: Record<Side, string[]>;
  games: GameScore[];
  server: Side;
  status: MatchStatus;
  winner: Side | null;
  /** Epoch ms. */
  startedAt: number | null;
  finishedAt: number | null;
  /** Rally log (oldest first) for undo and the momentum strip. */
  history: { side: Side; previousServer: Side }[];
  /** Set when an umpire scores this match; the demo simulator then leaves it alone. */
  controlledBy: "umpire" | null;
}

export interface LiveSnapshot {
  slug: string;
  /** True when matches are simulated (demo mode). */
  demo: boolean;
  courts: number;
  matches: LiveMatch[];
  updatedAt: number;
}
