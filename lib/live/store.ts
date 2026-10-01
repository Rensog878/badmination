import "server-only";
import { addPoint, matchWinner, type Side } from "@/lib/live/scoring";
import type { LiveMatch, LiveSnapshot } from "@/lib/live/types";
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
}

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

/** The live page is available while a tournament is actually live, or in demo mode. */
export function liveAvailable(t: Tournament, now: number): { available: boolean; demo: boolean } {
  if (getStatus(t, now) === "live") return { available: true, demo: false };
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
  };
}

/** Plays random rallies so live matches start mid-game. */
function fastForward(match: LiveMatch, rallies: number) {
  let state = { games: match.games, server: match.server };
  for (let i = 0; i < rallies && !matchWinner(state.games); i++) state = addPoint(state, randomRallyWinner(state.server));
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
    matches.push(m);
  }
  for (let i = 0; i < 6; i++) matches.push(demoMatch(t, 2));
  return { slug: t.slug, demo: true, courts: DEMO_COURTS, matches, updatedAt: now };
}

function demoTick(feed: Feed, t: Tournament) {
  const now = Date.now();
  const snap = feed.snapshot;
  const live = snap.matches.filter((m) => m.status === "live");
  if (live.length === 0) return;
  const match = pick(live);
  const state = addPoint({ games: match.games.length ? match.games : [{ a: 0, b: 0 }], server: match.server }, randomRallyWinner(match.server));
  match.games = state.games;
  match.server = state.server;

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
    };
    feeds.set(t.slug, feed);
  }
  return feed;
}

function publish(feed: Feed) {
  for (const listener of feed.listeners) listener(feed.snapshot);
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
