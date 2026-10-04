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
  /** Optional live stream or highlight replay URL (YouTube, Twitch, Vimeo, MP4, etc.) */
  streamUrl?: string | null;
  /** Estimated match start time e.g. "11:30 AM" */
  estimatedTime?: string | null;
  /** Set when a player is actively paged to a court */
  calledToCourt?: number | null;
}

export interface LiveSnapshot {
  slug: string;
  /** True when matches are simulated (demo mode). */
  demo: boolean;
  courts: number;
  matches: LiveMatch[];
  updatedAt: number;
  /** Active venue paging announcement (e.g. "Calling Court 3: A. Sharma vs R. Verma") */
  activeAnnouncement?: string | null;
}
