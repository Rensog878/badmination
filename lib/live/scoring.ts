/**
 * Badminton scoring (BWF Laws, rally point): games to 21, a 2-point lead is
 * needed from 20-all, and the side reaching 30 first wins at 29-all. Best of
 * three games. Pure functions: shared by the live feed and the scoreboard.
 */

export type Side = "a" | "b";

export interface GameScore {
  a: number;
  b: number;
}

export const POINTS_TO_WIN = 21;
export const POINT_CAP = 30;
export const GAMES_TO_WIN = 2;

export const other = (side: Side): Side => (side === "a" ? "b" : "a");

export function gameWinner(g: GameScore): Side | null {
  const lead: Side = g.a >= g.b ? "a" : "b";
  const hi = Math.max(g.a, g.b);
  const lo = Math.min(g.a, g.b);
  if (hi >= POINT_CAP) return lead;
  if (hi >= POINTS_TO_WIN && hi - lo >= 2) return lead;
  return null;
}

export function gamesWon(games: readonly GameScore[], side: Side): number {
  return games.filter((g) => gameWinner(g) === side).length;
}

export function matchWinner(games: readonly GameScore[]): Side | null {
  if (gamesWon(games, "a") >= GAMES_TO_WIN) return "a";
  if (gamesWon(games, "b") >= GAMES_TO_WIN) return "b";
  return null;
}

export interface RallyState {
  games: GameScore[];
  /** Side serving the next rally. */
  server: Side;
}

/**
 * Applies one rally won by `side`. The rally winner serves next. When a game
 * ends, a new 0-0 game starts (unless the match is over) and the game winner serves.
 */
export function addPoint(state: RallyState, side: Side): RallyState {
  if (matchWinner(state.games)) return state;
  const games = state.games.length ? state.games.map((g) => ({ ...g })) : [{ a: 0, b: 0 }];
  const current = games[games.length - 1];
  current[side] += 1;
  if (gameWinner(current) && !matchWinner(games)) games.push({ a: 0, b: 0 });
  return { games, server: side };
}

/** Undo the last rally (for umpire corrections). Server reverts to `previousServer`. */
export function removePoint(state: RallyState, side: Side, previousServer: Side): RallyState {
  const games = state.games.map((g) => ({ ...g }));
  let current = games[games.length - 1];
  // If a fresh 0-0 game was just opened, step back into the finished game.
  if (current && current.a === 0 && current.b === 0 && games.length > 1) {
    games.pop();
    current = games[games.length - 1];
  }
  if (!current || current[side] === 0) return state;
  current[side] -= 1;
  return { games, server: previousServer };
}

/** "Game point", "Match point" or null for the side that could win on the next rally. */
export function pressurePoint(games: readonly GameScore[]): { side: Side; kind: "game" | "match" } | null {
  if (matchWinner(games) || games.length === 0) return null;
  const current = games[games.length - 1];
  for (const side of ["a", "b"] as const) {
    const next = { ...current, [side]: current[side] + 1 };
    if (gameWinner(next) === side) {
      return { side, kind: gamesWon(games, side) + 1 >= GAMES_TO_WIN ? "match" : "game" };
    }
  }
  return null;
}
