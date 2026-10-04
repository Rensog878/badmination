import "server-only";
import { addPoint, matchWinner, removePoint, type Side } from "@/lib/live/scoring";
import type { LiveMatch, LiveSnapshot } from "@/lib/live/types";
import { collection, dbConfigured } from "@/lib/db/mongo";
import { eventLabel, getStatus, type Tournament } from "@/lib/tournaments";

/**
 * In-memory live feed per tournament, pushed to clients over SSE.
 * Single-process only: Phase 15 replaces this with the database plus a
 * pub/sub (e.g. MongoDB change streams) so it scales beyond one server.
 */

type Listener = (snapshot: LiveSnapshot) => void;

interface Feed {
  snapshot: LiveSnapshot;
  listeners: Set<Listener>;
  timer: ReturnType<typeof setInterval> | null;
  /** Resolves once a real feed has been loaded from the database. */
  hydrated: Promise<void> | null;
  saveTimer: ReturnType<typeof setTimeout> | null;
}

const SAVE_DEBOUNCE_MS = 500;

const DEMO_COURTS = 4;
const DEMO_TICK_MS = 1800;
const DEMO_SERVER_EDGE = 0.53; // chance the serving side wins the rally
const KEEP_FINISHED = 8;

// Survives hot reloads in dev without duplicating timers.
const globalFeeds = globalThis as typeof globalThis & { __liveFeeds?: Map<string, Feed> };
const feeds: Map<string, Feed> = (globalFeeds.__liveFeeds ??= new Map());

/** Demo mode is on in development, and in production only with LIVE_DEMO=1. */
export function isDemoEnabled(): boolean {
  if (process.env.LIVE_DEMO === "1") return true;
  if (process.env.LIVE_DEMO === "0") return false;
  return process.env.NODE_ENV !== "production";
}

/** The live page is available while a tournament is actually live, or has matches scheduled/live, or in demo mode. */
export function liveAvailable(t: Tournament, now: number): { available: boolean; demo: boolean } {
  const feed = feeds.get(t.slug);
  const hasRealMatches = Boolean(feed && !feed.snapshot.demo && feed.snapshot.matches.length > 0);
  const hasLiveMatch = Boolean(feed && feed.snapshot.matches.some((m) => m.status === "live"));

  if (getStatus(t, now) === "live" || hasLiveMatch || hasRealMatches) {
    return { available: true, demo: false };
  }
  return isDemoEnabled() ? { available: true, demo: true } : { available: false, demo: false };
}

// ---------- demo generator (clearly labelled as simulated in the UI) ----------

const SURNAMES = ["Rao", "Iyer", "Menon", "Shah", "Nair", "Das", "Kapoor", "Reddy", "Bose", "Gill", "Pillai", "Sethi", "Joshi", "Khan", "Varma", "Mehta"];
const INITIALS = "ABDKMNPRSTV";
const ROUNDS = ["Round of 32", "Round of 16", "Quarter-final", "Semi-final", "Final"];

let serial = 0;
const pick = <T,>(list: readonly T[]) => list[Math.floor(Math.random() * list.length)];
const demoName = () => `${pick(INITIALS.split(""))}. ${pick(SURNAMES)}`;

function demoMatch(t: Tournament, roundIndex: number): LiveMatch {
  const event = pick(t.events);
  const players = event.type === "Singles" ? 1 : 2;
  const side = () => Array.from({ length: players }, demoName);
  serial += 1;
  return {
    id: `m${serial}`,
    event: eventLabel(event),
    round: ROUNDS[Math.min(roundIndex, ROUNDS.length - 1)],
    court: null,
    sides: { a: side(), b: side() },
    games: [],
    server: Math.random() < 0.5 ? "a" : "b",
    status: "scheduled",
    winner: null,
    startedAt: null,
    finishedAt: null,
    history: [],
    controlledBy: null,
  };
}

/** Plays random rallies so live matches start mid-game. */
function fastForward(match: LiveMatch, rallies: number) {
  for (let i = 0; i < rallies && !matchWinner(match.games); i++) applyRally(match, randomRallyWinner(match.server));
}

/** One rally won by `side`, with history for undo. */
export function applyRally(match: LiveMatch, side: Side) {
  const state = addPoint({ games: match.games.length ? match.games : [{ a: 0, b: 0 }], server: match.server }, side);
  match.history.push({ side, previousServer: match.server });
  match.games = state.games;
  match.server = state.server;
}

function randomRallyWinner(server: Side): Side {
  return Math.random() < DEMO_SERVER_EDGE ? server : server === "a" ? "b" : "a";
}

function finish(match: LiveMatch, now: number) {
  match.status = "finished";
  match.winner = matchWinner(match.games);
  match.finishedAt = now;
}

function createDemoSnapshot(t: Tournament): LiveSnapshot {
  const now = Date.now();
  const matches: LiveMatch[] = [];
  for (let i = 0; i < 4; i++) {
    const m = demoMatch(t, 1);
    fastForward(m, 200);
    finish(m, now - (4 - i) * 6 * 60_000);
    matches.push(m);
  }
  for (let court = 1; court <= DEMO_COURTS; court++) {
    const m = demoMatch(t, 2);
    m.status = "live";
    m.court = court;
    m.startedAt = now - Math.floor(Math.random() * 20 + 5) * 60_000;
    fastForward(m, Math.floor(Math.random() * 45) + 5);
    if (matchWinner(m.games)) m.games = [{ a: 3, b: 2 }];
    if (court === 1) {
      m.streamUrl = "https://www.youtube.com/watch?v=Gk74i1e2L18";
    }
    matches.push(m);
  }
  for (let i = 0; i < 6; i++) matches.push(demoMatch(t, 2));
  return { slug: t.slug, demo: true, courts: DEMO_COURTS, matches, updatedAt: now };
}

function demoTick(feed: Feed, t: Tournament) {
  const now = Date.now();
  const snap = feed.snapshot;
  const live = snap.matches.filter((m) => m.status === "live" && m.controlledBy === null);
  if (live.length === 0) return;
  const match = pick(live);
  applyRally(match, randomRallyWinner(match.server));

  if (matchWinner(match.games)) {
    finish(match, now);
    const court = match.court;
    let next = snap.matches.find((m) => m.status === "scheduled");
    if (!next) {
      next = demoMatch(t, ROUNDS.indexOf(match.round) + 1);
      snap.matches.push(next);
    }
    next.status = "live";
    next.court = court;
    next.startedAt = now;
    next.games = [{ a: 0, b: 0 }];
    // Keep a full queue and a bounded history.
    snap.matches.push(demoMatch(t, ROUNDS.indexOf(match.round)));
    const finished = snap.matches.filter((m) => m.status === "finished").sort((x, y) => (y.finishedAt ?? 0) - (x.finishedAt ?? 0));
    const drop = new Set(finished.slice(KEEP_FINISHED).map((m) => m.id));
    snap.matches = snap.matches.filter((m) => !drop.has(m.id));
  }
  snap.updatedAt = now;
  publish(feed);
}

// ---------- feed API ----------

function getFeed(t: Tournament): Feed {
  let feed = feeds.get(t.slug);
  if (!feed) {
    const demo = liveAvailable(t, Date.now()).demo;
    feed = {
      snapshot: demo ? createDemoSnapshot(t) : { slug: t.slug, demo: false, courts: DEMO_COURTS, matches: [], updatedAt: Date.now() },
      listeners: new Set(),
      timer: null,
      hydrated: null,
      saveTimer: null,
    };
    feeds.set(t.slug, feed);
  }
  return feed;
}

function publish(feed: Feed) {
  for (const listener of feed.listeners) listener(feed.snapshot);
  if (!feed.snapshot.demo) scheduleSave(feed);
}

/** Real feeds are written through to MongoDB (debounced) so restarts keep scores. */
function scheduleSave(feed: Feed) {
  if (!dbConfigured() || feed.saveTimer) return;
  feed.saveTimer = setTimeout(async () => {
    feed.saveTimer = null;
    try {
      const col = await collection<LiveSnapshot>("liveFeeds");
      await col.replaceOne({ slug: feed.snapshot.slug }, feed.snapshot, { upsert: true });
    } catch (e) {
      console.error("[live] failed to save feed", feed.snapshot.slug, e);
    }
  }, SAVE_DEBOUNCE_MS);
}

/** Flushes in-memory feed immediately to MongoDB so upcoming server reads and actions see the latest state. */
export async function flushFeed(t: Tournament): Promise<void> {
  const feed = feeds.get(t.slug);
  if (!feed || !dbConfigured() || feed.snapshot.demo) return;
  if (feed.saveTimer) {
    clearTimeout(feed.saveTimer);
    feed.saveTimer = null;
  }
  try {
    const col = await collection<LiveSnapshot>("liveFeeds");
    await col.replaceOne({ slug: feed.snapshot.slug }, feed.snapshot, { upsert: true });
  } catch (e) {
    console.error("[live] failed to flush feed to DB", feed.snapshot.slug, e);
  }
}

/** Call (await) before reading or changing a feed: loads saved real feeds once per process. */
export async function ensureFeed(t: Tournament, options?: { forceReal?: boolean }): Promise<void> {
  const feed = getFeed(t);
  if (!dbConfigured()) {
    if (options?.forceReal && feed.snapshot.demo) {
      feed.snapshot.demo = false;
      if (feed.timer) {
        clearInterval(feed.timer);
        feed.timer = null;
      }
    }
    return;
  }
  feed.hydrated ??= (async () => {
    try {
      const saved = await (await collection<LiveSnapshot>("liveFeeds")).findOne({ slug: t.slug }, { projection: { _id: 0 } });
      if (saved && (saved.matches?.length > 0 || !saved.demo)) {
        feed.snapshot = { ...saved, demo: false };
        if (feed.timer) {
          clearInterval(feed.timer);
          feed.timer = null;
        }
      }
    } catch (e) {
      feed.hydrated = null;
      console.error("[live] failed to load feed from DB", e);
    }
  })();
  await feed.hydrated;

  if (options?.forceReal && feed.snapshot.demo) {
    feed.snapshot.demo = false;
    if (feed.timer) {
      clearInterval(feed.timer);
      feed.timer = null;
    }
    scheduleSave(feed);
  }
}

export function getSnapshot(t: Tournament): LiveSnapshot {
  return getFeed(t).snapshot;
}

/** Subscribes to updates; the demo simulator only runs while someone is watching. */
export function subscribe(t: Tournament, listener: Listener): () => void {
  const feed = getFeed(t);
  feed.listeners.add(listener);
  if (feed.snapshot.demo && !feed.timer) feed.timer = setInterval(() => demoTick(feed, t), DEMO_TICK_MS);
  return () => {
    feed.listeners.delete(listener);
    if (feed.listeners.size === 0 && feed.timer) {
      clearInterval(feed.timer);
      feed.timer = null;
    }
  };
}

/** Entry point for real scoring (Phase 13 umpire tools / Phase 15 admin). */
export function updateMatch(t: Tournament, id: string, mutate: (match: LiveMatch) => void): LiveMatch | null {
  const feed = getFeed(t);
  const match = feed.snapshot.matches.find((m) => m.id === id);
  if (!match) return null;
  mutate(match);
  feed.snapshot.updatedAt = Date.now();
  publish(feed);
  return match;
}

// ---------- umpire operations (auth is checked by the calling server action) ----------

export type UmpireResult = { ok: true; match: LiveMatch } | { ok: false; error: string };

export function umpireScore(t: Tournament, id: string, side: Side): UmpireResult {
  let error: string | null = null;
  const match = updateMatch(t, id, (m) => {
    if (m.status !== "live") {
      error = "This match isn't in play.";
      return;
    }
    m.controlledBy = "umpire";
    applyRally(m, side);
    if (matchWinner(m.games)) finish(m, Date.now());
  });
  if (!match) return { ok: false, error: "Match not found." };
  return error ? { ok: false, error } : { ok: true, match };
}

export function umpireUndo(t: Tournament, id: string): UmpireResult {
  let error: string | null = null;
  const match = updateMatch(t, id, (m) => {
    const last = m.history.pop();
    if (!last) {
      error = "Nothing to undo.";
      return;
    }
    const state = removePoint({ games: m.games, server: m.server }, last.side, last.previousServer);
    m.games = state.games;
    m.server = state.server;
    m.controlledBy = "umpire";
    // Undoing the winning rally reopens the match.
    if (m.status === "finished") {
      m.status = "live";
      m.winner = null;
      m.finishedAt = null;
    }
  });
  if (!match) return { ok: false, error: "Match not found." };
  return error ? { ok: false, error } : { ok: true, match };
}

/** Puts a scheduled match on the lowest-numbered free court. */
export function umpireStart(t: Tournament, id: string): UmpireResult {
  const snap = getFeed(t).snapshot;
  const busy = new Set(snap.matches.filter((m) => m.status === "live").map((m) => m.court));
  const court = Array.from({ length: snap.courts }, (_, i) => i + 1).find((c) => !busy.has(c));
  if (!court) return { ok: false, error: "All courts are in use." };
  let error: string | null = null;
  const match = updateMatch(t, id, (m) => {
    if (m.status !== "scheduled") {
      error = "This match has already started.";
      return;
    }
    m.status = "live";
    m.court = court;
    m.startedAt = Date.now();
    m.games = [{ a: 0, b: 0 }];
    m.controlledBy = "umpire";
  });
  if (!match) return { ok: false, error: "Match not found." };
  return error ? { ok: false, error } : { ok: true, match };
}

// ---------- match management (admin) ----------

export function addMatch(
  t: Tournament,
  input: {
    event: string;
    round: string;
    a: string[];
    b: string[];
    court?: number | null;
    status?: LiveMatch["status"];
    games?: LiveMatch["games"];
    winner?: LiveMatch["winner"];
    streamUrl?: string | null;
  },
): LiveMatch {
  const feed = getFeed(t);
  serial += 1;
  const status = input.status ?? "scheduled";
  let court = input.court ?? null;
  let games = input.games && input.games.length > 0 ? input.games : [];

  if (status === "live") {
    if (court === null) {
      const busyCourts = new Set(
        feed.snapshot.matches.filter((m) => m.status === "live" && m.court !== null).map((m) => m.court as number),
      );
      const freeCourt = Array.from({ length: feed.snapshot.courts }, (_, i) => i + 1).find((c) => !busyCourts.has(c));
      court = freeCourt ?? 1;
    }
    if (games.length === 0) {
      games = [{ a: 0, b: 0 }];
    }
  }

  const match: LiveMatch = {
    id: `m${Date.now().toString(36)}${serial}`,
    event: input.event,
    round: input.round,
    court,
    sides: { a: input.a, b: input.b },
    games,
    server: "a",
    status,
    winner: input.winner ?? null,
    startedAt: status === "live" ? Date.now() : null,
    finishedAt: status === "finished" ? Date.now() : null,
    history: [],
    controlledBy: "umpire",
    streamUrl: input.streamUrl?.trim() || null,
  };
  feed.snapshot.demo = false;
  if (feed.timer) {
    clearInterval(feed.timer);
    feed.timer = null;
  }
  feed.snapshot.matches.push(match);
  feed.snapshot.updatedAt = Date.now();
  publish(feed);
  return match;
}

export interface EditMatchInput {
  id: string;
  event?: string;
  round?: string;
  court?: number | null;
  a?: string[];
  b?: string[];
  status?: LiveMatch["status"];
  games?: LiveMatch["games"];
  winner?: LiveMatch["winner"];
  streamUrl?: string | null;
  calledToCourt?: number | null;
  estimatedTime?: string | null;
}

export function editMatch(t: Tournament, input: EditMatchInput): LiveMatch | null {
  const feed = getFeed(t);
  const match = feed.snapshot.matches.find((m) => m.id === input.id);
  if (!match) return null;

  if (input.event !== undefined) match.event = input.event;
  if (input.round !== undefined) match.round = input.round;
  if (input.court !== undefined) match.court = input.court;
  if (input.a !== undefined && input.a.length > 0) match.sides.a = input.a;
  if (input.b !== undefined && input.b.length > 0) match.sides.b = input.b;
  if (input.games !== undefined) match.games = input.games;
  if (input.streamUrl !== undefined) match.streamUrl = input.streamUrl?.trim() || null;
  if (input.calledToCourt !== undefined) match.calledToCourt = input.calledToCourt;
  if (input.estimatedTime !== undefined) match.estimatedTime = input.estimatedTime;

  if (input.status !== undefined) {
    match.status = input.status;
    if (input.status === "live") {
      match.startedAt ??= Date.now();
      match.finishedAt = null;
      // Auto-assign court if still unassigned
      if (match.court === null) {
        const busyCourts = new Set(
          feed.snapshot.matches
            .filter((m) => m.id !== match.id && m.status === "live" && m.court !== null)
            .map((m) => m.court as number),
        );
        const freeCourt = Array.from({ length: feed.snapshot.courts }, (_, i) => i + 1).find((c) => !busyCourts.has(c));
        match.court = freeCourt ?? 1;
      }
      // Ensure games array has at least one active game
      if (!match.games || match.games.length === 0) {
        match.games = [{ a: 0, b: 0 }];
      }
    } else if (input.status === "finished") {
      match.finishedAt ??= Date.now();
      match.winner = input.winner ?? matchWinner(match.games);
    } else if (input.status === "scheduled") {
      match.court = null;
      match.startedAt = null;
      match.finishedAt = null;
      match.winner = null;
    }
  }

  if (input.winner !== undefined) {
    match.winner = input.winner;
  }

  match.controlledBy = "umpire";
  feed.snapshot.demo = false;
  if (feed.timer) {
    clearInterval(feed.timer);
    feed.timer = null;
  }
  feed.snapshot.updatedAt = Date.now();
  publish(feed);
  return match;
}

export function removeMatch(t: Tournament, id: string): boolean {
  const feed = getFeed(t);
  const before = feed.snapshot.matches.length;
  feed.snapshot.matches = feed.snapshot.matches.filter((m) => m.id !== id);
  if (feed.snapshot.matches.length === before) return false;
  feed.snapshot.updatedAt = Date.now();
  publish(feed);
  return true;
}

export function seedTournamentDraw(t: Tournament, category: "singles" | "doubles" = "singles"): LiveMatch[] {
  const feed = getFeed(t);
  const event = category === "singles" ? "Open Singles" : "Open Doubles";
  const seedPairs =
    category === "singles"
      ? [
          { round: "Quarter-Finals", a: ["Viktor Axelsen"], b: ["Kidambi Srikanth"], games: [{ a: 21, b: 17 }, { a: 21, b: 19 }], winner: "a" as Side },
          { round: "Quarter-Finals", a: ["Lakshya Sen"], b: ["Lee Zii Jia"], games: [{ a: 21, b: 19 }, { a: 18, b: 21 }, { a: 21, b: 16 }], winner: "a" as Side },
          { round: "Quarter-Finals", a: ["Kodai Naraoka"], b: ["Prannoy H.S."], games: [{ a: 16, b: 21 }, { a: 21, b: 17 }, { a: 21, b: 18 }], winner: "a" as Side },
          { round: "Quarter-Finals", a: ["Shi Yuqi"], b: ["Anders Antonsen"], games: [{ a: 21, b: 18 }, { a: 21, b: 15 }], winner: "a" as Side },
          { round: "Semi-Finals", a: ["Viktor Axelsen"], b: ["Lakshya Sen"], games: [{ a: 21, b: 19 }, { a: 21, b: 18 }], winner: "a" as Side },
          { round: "Semi-Finals", a: ["Shi Yuqi"], b: ["Kodai Naraoka"], games: [{ a: 21, b: 17 }, { a: 22, b: 20 }], winner: "a" as Side },
          { round: "Championship Final", a: ["Viktor Axelsen"], b: ["Shi Yuqi"], games: [{ a: 21, b: 18 }, { a: 19, b: 21 }, { a: 21, b: 17 }], winner: "a" as Side },
        ]
      : [
          { round: "Quarter-Finals", a: ["Rankireddy", "Shetty"], b: ["Hoki", "Kobayashi"], games: [{ a: 21, b: 18 }, { a: 21, b: 16 }], winner: "a" as Side },
          { round: "Quarter-Finals", a: ["Astrup", "Rasmussen"], b: ["Chia", "Soh"], games: [{ a: 21, b: 19 }, { a: 19, b: 21 }, { a: 21, b: 17 }], winner: "a" as Side },
          { round: "Quarter-Finals", a: ["Liang", "Wang"], b: ["Kang", "Seo"], games: [{ a: 21, b: 17 }, { a: 21, b: 15 }], winner: "a" as Side },
          { round: "Quarter-Finals", a: ["Alfian", "Ardianto"], b: ["Carnando", "Marthin"], games: [{ a: 21, b: 16 }, { a: 21, b: 14 }], winner: "a" as Side },
          { round: "Semi-Finals", a: ["Rankireddy", "Shetty"], b: ["Astrup", "Rasmussen"], games: [{ a: 21, b: 16 }, { a: 21, b: 17 }], winner: "a" as Side },
          { round: "Semi-Finals", a: ["Liang", "Wang"], b: ["Alfian", "Ardianto"], games: [{ a: 21, b: 19 }, { a: 18, b: 21 }, { a: 21, b: 16 }], winner: "a" as Side },
          { round: "Championship Final", a: ["Rankireddy", "Shetty"], b: ["Liang", "Wang"], games: [{ a: 21, b: 19 }, { a: 18, b: 21 }, { a: 21, b: 18 }], winner: "a" as Side },
        ];

  feed.snapshot.matches = feed.snapshot.matches.filter((m) => m.event !== event);

  const created: LiveMatch[] = [];
  for (const s of seedPairs) {
    serial += 1;
    const match: LiveMatch = {
      id: `m${Date.now().toString(36)}${serial}`,
      event,
      round: s.round,
      court: s.round === "Championship Final" ? 1 : null,
      sides: { a: s.a, b: s.b },
      games: s.games,
      server: "a",
      status: s.winner ? "finished" : "scheduled",
      winner: s.winner,
      startedAt: Date.now() - 3600000,
      finishedAt: Date.now() - 1800000,
      history: [],
      controlledBy: "umpire",
    };
    feed.snapshot.matches.push(match);
    created.push(match);
  }
  feed.snapshot.demo = false;
  if (feed.timer) {
    clearInterval(feed.timer);
    feed.timer = null;
  }
  feed.snapshot.updatedAt = Date.now();
  publish(feed);
  return created;
}

export function clearMatches(t: Tournament): void {
  const feed = getFeed(t);
  feed.snapshot.matches = [];
  feed.snapshot.demo = false;
  if (feed.timer) {
    clearInterval(feed.timer);
    feed.timer = null;
  }
  feed.snapshot.updatedAt = Date.now();
  publish(feed);
}

export function broadcastAnnouncement(t: Tournament, message: string | null): void {
  const feed = getFeed(t);
  feed.snapshot.activeAnnouncement = message && message.trim() ? message.trim() : null;
  feed.snapshot.updatedAt = Date.now();
  publish(feed);
}

export function callMatchToCourt(t: Tournament, id: string, courtNumber: number): LiveMatch | null {
  const feed = getFeed(t);
  const match = feed.snapshot.matches.find((m) => m.id === id);
  if (!match) return null;
  match.calledToCourt = courtNumber;
  const pA = match.sides.a.join(" / ");
  const pB = match.sides.b.join(" / ");
  feed.snapshot.activeAnnouncement = `🔔 MATCH CALL: Court ${courtNumber} — ${pA} vs ${pB} (${match.event} · ${match.round}). Please report to court immediately!`;
  feed.snapshot.updatedAt = Date.now();
  publish(feed);
  return match;
}

