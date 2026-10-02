"use client";

import { useEffect, useMemo, useState, useId } from "react";
import Link from "next/link";
import {
  Clock,
  Expand,
  Flame,
  Radio,
  Search,
  Trophy,
} from "lucide-react";
import RollingScore from "@/components/live/RollingScore";
import { sideName } from "@/components/live/CourtCard";
import { useIndicator } from "@/components/ui/useIndicator";
import {
  gameWinner,
  gamesWon,
  pressurePoint,
} from "@/lib/live/scoring";
import type { LiveMatch, LiveSnapshot } from "@/lib/live/types";
import type { Tournament } from "@/lib/tournaments";

export interface LiveTournamentItem {
  tournament: Tournament;
  initial: LiveSnapshot;
  demo: boolean;
}

export type CourtFilter = "all" | "live" | "pressure" | "scheduled" | "finished";

const FILTERS: { value: CourtFilter; label: string; icon?: typeof Flame }[] = [
  { value: "all", label: "All courts" },
  { value: "live", label: "Live in play" },
  { value: "pressure", label: "Pressure points", icon: Flame },
  { value: "scheduled", label: "Up next" },
  { value: "finished", label: "Results" },
];

/** Rallies of the game in progress for the momentum strip. */
function getMatchRallies(m: LiveMatch) {
  const g = m.games[m.games.length - 1];
  const n = g ? g.a + g.b : 0;
  return n ? m.history.slice(-n) : [];
}

const scoreLine = (m: LiveMatch) =>
  m.games
    .filter((g) => g.a + g.b > 0)
    .map((g) => (m.winner === "b" ? `${g.b}–${g.a}` : `${g.a}–${g.b}`))
    .join(", ");

export default function LiveHub({ items }: { items: LiveTournamentItem[] }) {
  const [selectedTournament, setSelectedTournament] = useState<string>("all");
  const [filter, setFilter] = useState<CourtFilter>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [activeMobileTab, setActiveMobileTab] = useState<"courts" | "queue" | "results">("courts");

  // Keep state for each tournament's live snapshot
  const [snapshots, setSnapshots] = useState<Record<string, LiveSnapshot>>(() =>
    Object.fromEntries(items.map((i) => [i.tournament.slug, i.initial])),
  );
  const [connections, setConnections] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(items.map((i) => [i.tournament.slug, true])),
  );

  const uid = useId();
  const searchInputId = `${uid}-search`;

  // Multi-feed SSE subscriptions
  useEffect(() => {
    const sources: EventSource[] = [];

    const connectAll = () => {
      // Close any active sources
      sources.forEach((s) => s.close());
      sources.length = 0;

      items.forEach(({ tournament }) => {
        const slug = tournament.slug;
        const source = new EventSource(`/api/live/${encodeURIComponent(slug)}`);

        source.addEventListener("snapshot", (event) => {
          try {
            const data = JSON.parse(event.data) as LiveSnapshot;
            setSnapshots((prev) => ({ ...prev, [slug]: data }));
            setConnections((prev) => ({ ...prev, [slug]: true }));
          } catch {
            // Ignore malformed snapshot
          }
        });

        source.onerror = () => {
          setConnections((prev) => ({ ...prev, [slug]: false }));
        };

        sources.push(source);
      });
    };

    connectAll();

    // Reconnect on tab unlock/wake if phone was backgrounded
    const onVisibility = () => {
      if (document.visibilityState === "visible") {
        connectAll();
      }
    };
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      document.removeEventListener("visibilitychange", onVisibility);
      sources.forEach((s) => s.close());
    };
  }, [items]);

  // Aggregate matches based on selected tournament
  const activeSnapshots = useMemo(() => {
    if (selectedTournament === "all") return Object.values(snapshots);
    const snap = snapshots[selectedTournament];
    return snap ? [snap] : [];
  }, [snapshots, selectedTournament]);

  // Tournaments map for easy name lookup
  const tournamentMap = useMemo(() => {
    return new Map(items.map((i) => [i.tournament.slug, i.tournament]));
  }, [items]);

  // Combined matches list
  const allMatchesWithContext = useMemo(() => {
    const list: { match: LiveMatch; snapshot: LiveSnapshot; tournamentName: string }[] = [];
    activeSnapshots.forEach((snap) => {
      const t = tournamentMap.get(snap.slug);
      const name = t ? t.name : snap.slug;
      snap.matches.forEach((m) => {
        list.push({ match: m, snapshot: snap, tournamentName: name });
      });
    });
    return list;
  }, [activeSnapshots, tournamentMap]);

  // Metrics
  const liveMatches = useMemo(
    () => allMatchesWithContext.filter((x) => x.match.status === "live"),
    [allMatchesWithContext],
  );
  const scheduledMatches = useMemo(
    () => allMatchesWithContext.filter((x) => x.match.status === "scheduled"),
    [allMatchesWithContext],
  );
  const finishedMatches = useMemo(
    () =>
      allMatchesWithContext
        .filter((x) => x.match.status === "finished")
        .sort((a, b) => (b.match.finishedAt ?? 0) - (a.match.finishedAt ?? 0)),
    [allMatchesWithContext],
  );

  const pressureMatches = useMemo(
    () => liveMatches.filter((x) => pressurePoint(x.match.games) !== null),
    [liveMatches],
  );

  // Spotlight match: Highest stakes currently in play
  // Priority: Match Point -> Game Point -> Court 1 Live -> First live match
  const spotlight = useMemo(() => {
    if (liveMatches.length === 0) return null;
    const matchPointMatch = liveMatches.find(
      (x) => pressurePoint(x.match.games)?.kind === "match",
    );
    if (matchPointMatch) return matchPointMatch;

    const gamePointMatch = liveMatches.find(
      (x) => pressurePoint(x.match.games)?.kind === "game",
    );
    if (gamePointMatch) return gamePointMatch;

    const court1Match = liveMatches.find((x) => x.match.court === 1);
    if (court1Match) return court1Match;

    return liveMatches[0];
  }, [liveMatches]);

  // Filtered court list
  const filteredMatches = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return allMatchesWithContext.filter(({ match, tournamentName }) => {
      // Status filter
      if (filter === "live" && match.status !== "live") return false;
      if (filter === "pressure" && (!pressurePoint(match.games) || match.status !== "live")) return false;
      if (filter === "scheduled" && match.status !== "scheduled") return false;
      if (filter === "finished" && match.status !== "finished") return false;

      // Query filter
      if (q) {
        const text = `${tournamentName} ${match.event} ${match.round} ${sideName(match, "a")} ${sideName(match, "b")}`.toLowerCase();
        if (!text.includes(q)) return false;
      }
      return true;
    });
  }, [allMatchesWithContext, filter, searchQuery]);

  // Indicators for tournament switcher and tabs
  const tourneyIndicator = useIndicator<HTMLDivElement>(selectedTournament, true);
  const filterIndicator = useIndicator<HTMLDivElement>(filter, true);
  const mobileTabIndicator = useIndicator<HTMLDivElement>(activeMobileTab);

  const isDemo = items.some((i) => i.demo);
  const isAllConnected = Object.values(connections).every(Boolean);

  return (
    <div className="space-y-12">
      {/* Broadcast Header & Stats Banner */}
      <section aria-label="Broadcast Command Center" className="border-b border-off-white/10 pb-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-3">
              <span className="relative flex items-center gap-2 rounded-full border border-court-green/40 bg-court-green/10 px-3 py-1 font-display text-xs font-semibold tracking-[0.2em] text-court-green uppercase">
                <span className="relative flex size-2">
                  <span className="absolute inset-0 animate-ping rounded-full bg-court-green opacity-75 motion-reduce:animate-none" />
                  <span className="relative size-2 rounded-full bg-court-green" />
                </span>
                {isDemo ? "Live Demo Sim" : "Arena Broadcast"}
              </span>
              <span className="font-display text-xs tracking-[0.15em] text-muted uppercase">
                {isAllConnected ? "All feeds active" : "Reconnecting feeds…"}
              </span>
            </div>
            <h1 className="mt-4 font-display text-[clamp(2.5rem,5.5vw,4.5rem)] leading-[0.94] font-bold tracking-[-0.03em] uppercase">
              Live Command Hub
            </h1>
            <p className="mt-2 text-sm text-muted sm:text-base">
              Real-time court monitor, point-by-point rally radar, and tournament momentum.
            </p>
          </div>

          {/* Quick Metrics Ribbon */}
          <dl className="grid grid-cols-2 gap-px rounded-xl border border-off-white/10 bg-off-white/10 sm:grid-cols-4">
            {[
              { label: "Courts live", value: liveMatches.length, color: "text-court-green" },
              { label: "Pressure pts", value: pressureMatches.length, color: pressureMatches.length ? "text-court-green" : "text-off-white" },
              { label: "Up next", value: scheduledMatches.length, color: "text-off-white" },
              { label: "Completed", value: finishedMatches.length, color: "text-muted" },
            ].map((stat) => (
              <div key={stat.label} className="bg-charcoal px-4 py-3 sm:px-5 sm:py-4">
                <dt className="text-xs tracking-[0.15em] text-muted uppercase">{stat.label}</dt>
                <dd className={`mt-1 font-display text-2xl font-bold tabular-nums sm:text-3xl ${stat.color}`}>
                  {stat.value}
                </dd>
              </div>
            ))}
          </dl>
        </div>

        {/* Tournament Switcher (when multiple tournaments exist) */}
        {items.length > 1 && (
          <nav
            ref={tourneyIndicator.ref}
            aria-label="Filter by tournament"
            className="relative mt-8 flex flex-wrap gap-2 border-t border-off-white/10 pt-6"
          >
            <span
              aria-hidden="true"
              style={tourneyIndicator.style}
              className="indicator absolute top-6 left-0 rounded-full bg-off-white"
            />
            <button
              type="button"
              data-indicator="all"
              onClick={() => setSelectedTournament("all")}
              aria-pressed={selectedTournament === "all"}
              className={`relative inline-flex min-h-11 items-center rounded-full border px-4 font-display text-xs font-semibold tracking-[0.15em] uppercase transition-colors ${
                selectedTournament === "all"
                  ? "border-transparent text-black"
                  : "border-off-white/15 text-muted hover:text-off-white"
              } ${selectedTournament === "all" && !tourneyIndicator.ready ? "bg-off-white" : ""}`}
            >
              All tournaments ({items.length})
            </button>
            {items.map(({ tournament }) => (
              <button
                key={tournament.slug}
                type="button"
                data-indicator={tournament.slug}
                onClick={() => setSelectedTournament(tournament.slug)}
                aria-pressed={selectedTournament === tournament.slug}
                className={`relative inline-flex min-h-11 items-center rounded-full border px-4 font-display text-xs font-semibold tracking-[0.15em] uppercase transition-colors ${
                  selectedTournament === tournament.slug
                    ? "border-transparent text-black"
                    : "border-off-white/15 text-muted hover:text-off-white"
                } ${selectedTournament === tournament.slug && !tourneyIndicator.ready ? "bg-off-white" : ""}`}
              >
                {tournament.name}
              </button>
            ))}
          </nav>
        )}
      </section>

      {/* Spotlight Feature Match: Top Tension on Court */}
      {spotlight && (
        <section aria-labelledby="spotlight-heading" className="relative overflow-hidden rounded-2xl border border-court-green/40 bg-gradient-to-br from-black via-black to-court-green/10 p-6 sm:p-8 lg:p-10">
          <div className="absolute top-0 right-0 h-40 w-40 bg-court-green/10 blur-3xl pointer-events-none" />
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-off-white/10 pb-4">
            <div className="flex items-center gap-3">
              <span className="flex size-2 rounded-full bg-court-green" />
              <h2 id="spotlight-heading" className="font-display text-xs font-bold tracking-[0.2em] text-court-green uppercase sm:text-sm">
                Spotlight Arena {spotlight.match.court ? `· Court ${spotlight.match.court}` : ""}
              </h2>
              <span className="text-xs text-muted">
                {spotlight.tournamentName} · {spotlight.match.event} ({spotlight.match.round})
              </span>
            </div>
            {pressurePoint(spotlight.match.games) && (
              <span className="badge-pop rounded-full bg-court-green px-3 py-1 font-display text-xs font-bold tracking-[0.18em] text-black uppercase">
                {pressurePoint(spotlight.match.games)?.kind === "match" ? "Match Point" : "Game Point"} · {sideName(spotlight.match, pressurePoint(spotlight.match.games)!.side)}
              </span>
            )}
          </div>

          <div className="mt-6 flex flex-col gap-6 lg:grid lg:grid-cols-[1fr_auto_1fr] lg:items-center">
            {/* Side A */}
            <div className={`space-y-1.5 sm:space-y-2 ${spotlight.match.server === "a" ? "border-l-2 border-court-green pl-3.5 sm:pl-4" : "pl-3.5 sm:pl-4"}`}>
              <div className="flex items-center gap-2">
                <span className={`size-2 rounded-full ${spotlight.match.server === "a" ? "bg-court-green" : "bg-transparent"}`} />
                <p className="font-display text-xs tracking-[0.18em] text-muted uppercase">
                  {spotlight.match.server === "a" ? "Serving" : "Receiving"}
                </p>
              </div>
              <h3 className="font-display text-xl font-bold uppercase sm:text-3xl lg:text-4xl">
                {sideName(spotlight.match, "a")}
              </h3>
              <p className="font-display text-xs tracking-[0.15em] text-muted uppercase">
                Games won: {gamesWon(spotlight.match.games, "a")}
              </p>
            </div>

            {/* Score Centerpiece */}
            <div className="flex flex-col items-center justify-center py-2 sm:py-4">
              <div className="flex items-center gap-4 sm:gap-6 font-display font-bold tabular-nums">
                <RollingScore
                  value={spotlight.match.games[spotlight.match.games.length - 1]?.a ?? 0}
                  game={spotlight.match.games.length}
                  className="font-display text-5xl font-black text-off-white sm:text-7xl lg:text-8xl"
                />
                <span className="text-3xl text-muted/50 sm:text-5xl font-light">–</span>
                <RollingScore
                  value={spotlight.match.games[spotlight.match.games.length - 1]?.b ?? 0}
                  game={spotlight.match.games.length}
                  className="font-display text-5xl font-black text-off-white sm:text-7xl lg:text-8xl"
                />
              </div>

              {/* Completed Games chips */}
              <div className="mt-2.5 sm:mt-3 flex items-center gap-2">
                {spotlight.match.games.filter((g) => gameWinner(g)).map((g, idx) => (
                  <span
                    key={idx}
                    className="rounded-md border border-off-white/15 bg-black/60 px-2.5 py-1 font-display text-xs font-semibold tabular-nums text-muted"
                  >
                    Set {idx + 1}: {g.a}–{g.b}
                  </span>
                ))}
              </div>

              {/* Rallies momentum timeline */}
              <div className="mt-3.5 sm:mt-4 flex items-center gap-1" title="Game rally momentum">
                {getMatchRallies(spotlight.match).slice(-16).map((r, i) => (
                  <span
                    key={i}
                    className={`h-4 w-1.5 rounded-xs ${
                      r.side === "a" ? "-translate-y-1 bg-court-green" : "translate-y-1 bg-off-white/60"
                    }`}
                  />
                ))}
              </div>
            </div>

            {/* Side B */}
            <div className={`space-y-1.5 sm:space-y-2 ${spotlight.match.server === "b" ? "border-l-2 lg:border-l-0 lg:border-r-2 border-court-green pl-3.5 lg:pl-0 lg:pr-4" : "pl-3.5 lg:pl-0 lg:pr-4"} lg:text-right`}>
              <div className="flex items-center lg:justify-end gap-2">
                <span className={`size-2 rounded-full lg:order-2 ${spotlight.match.server === "b" ? "bg-court-green" : "bg-transparent"}`} />
                <p className="font-display text-xs tracking-[0.18em] text-muted uppercase lg:order-1">
                  {spotlight.match.server === "b" ? "Serving" : "Receiving"}
                </p>
              </div>
              <h3 className="font-display text-xl font-bold uppercase sm:text-3xl lg:text-4xl">
                {sideName(spotlight.match, "b")}
              </h3>
              <p className="font-display text-xs tracking-[0.15em] text-muted uppercase">
                Games won: {gamesWon(spotlight.match.games, "b")}
              </p>
            </div>
          </div>

          <div className="mt-8 flex flex-wrap items-center justify-between gap-4 border-t border-off-white/10 pt-5">
            <span className="text-xs text-muted">
              Live broadcast feed updating rally-by-rally
            </span>
            <Link
              href={`/tournaments/${spotlight.snapshot.slug}/live/${spotlight.match.id}`}
              className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-court-green px-5 py-2.5 font-display text-xs font-bold tracking-[0.18em] text-black uppercase transition-all hover:bg-off-white"
            >
              <Expand aria-hidden="true" className="size-4" />
              Full Scoreboard Broadcast
            </Link>
          </div>
        </section>
      )}

      {/* Controls & Filter Strip */}
      <section aria-label="Court controls and filters" className="space-y-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          {/* Status Filter Chips */}
          <div
            ref={filterIndicator.ref}
            role="group"
            aria-label="Filter court status"
            className="relative flex items-center gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden -mx-4 px-4 sm:mx-0 sm:px-0 sm:flex-wrap"
          >
            <span
              aria-hidden="true"
              style={filterIndicator.style}
              className="indicator absolute top-0 left-0 rounded-full bg-off-white"
            />
            {FILTERS.map((f) => (
              <button
                key={f.value}
                data-indicator={f.value}
                type="button"
                onClick={() => setFilter(f.value)}
                aria-pressed={filter === f.value}
                className={`relative inline-flex shrink-0 min-h-11 items-center gap-1.5 rounded-full border px-4 py-2 font-display text-xs font-semibold tracking-[0.12em] uppercase transition-colors ${
                  filter === f.value
                    ? "border-transparent text-black"
                    : "border-off-white/15 text-muted hover:text-off-white"
                } ${filter === f.value && !filterIndicator.ready ? "bg-off-white" : ""}`}
              >
                {f.icon && <f.icon aria-hidden="true" className={`size-3.5 ${filter === f.value ? "text-black" : "text-court-green"}`} />}
                {f.label}
              </button>
            ))}
          </div>

          {/* Quick Search */}
          <div className="relative w-full sm:w-72 shrink-0">
            <label htmlFor={searchInputId} className="sr-only">
              Search player or category
            </label>
            <Search aria-hidden="true" className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted" />
            <input
              id={searchInputId}
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search player, event, court…"
              className="min-h-11 w-full rounded-lg border border-off-white/15 bg-black/40 py-2.5 pr-4 pl-10 text-sm text-off-white placeholder:text-muted focus:border-court-green focus:outline-none"
            />
          </div>
        </div>

        {/* Mobile Tab Switcher */}
        <div ref={mobileTabIndicator.ref} className="relative flex border-b border-off-white/10 lg:hidden">
          <span aria-hidden="true" style={mobileTabIndicator.style} className="indicator absolute -bottom-px left-0 h-0.5 bg-court-green" />
          {[
            { id: "courts", label: `Courts (${filteredMatches.length})` },
            { id: "queue", label: `Up Next (${scheduledMatches.length})` },
            { id: "results", label: `Results (${finishedMatches.length})` },
          ].map((tab) => (
            <button
              key={tab.id}
              data-indicator={tab.id}
              type="button"
              onClick={() => setActiveMobileTab(tab.id as "courts" | "queue" | "results")}
              aria-pressed={activeMobileTab === tab.id}
              className={`flex-1 min-h-11 py-3 text-center font-display text-xs font-semibold tracking-[0.15em] uppercase transition-colors ${
                activeMobileTab === tab.id ? "text-off-white" : "text-muted"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </section>

      {/* Main Command Center Layout: Courts Grid + Side Rails */}
      <div className="grid gap-10 lg:grid-cols-[1fr_22rem] xl:grid-cols-[1fr_26rem]">
        {/* Left Column: Courts Grid */}
        <div className={`space-y-6 ${activeMobileTab !== "courts" ? "hidden lg:block" : ""}`}>
          <div className="flex items-center justify-between border-b border-off-white/10 pb-3">
            <h2 className="font-display text-xs font-semibold tracking-[0.2em] text-muted uppercase">
              Courts in Action ({filteredMatches.length})
            </h2>
            <span className="text-xs text-muted">
              Click any match to open live scoreboard
            </span>
          </div>

          {filteredMatches.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-off-white/15 p-12 text-center">
              <Radio aria-hidden="true" className="mx-auto size-8 text-muted" />
              <p className="mt-4 font-display text-lg font-bold uppercase">No matches match current filter</p>
              <p className="mt-2 text-sm text-muted">Try clearing the search query or changing your status filter.</p>
              <button
                type="button"
                onClick={() => {
                  setFilter("all");
                  setSearchQuery("");
                }}
                className="mt-6 rounded-lg border border-court-green px-5 py-2.5 font-display text-xs font-semibold tracking-[0.18em] text-court-green uppercase hover:bg-court-green hover:text-black"
              >
                Reset filters
              </button>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {filteredMatches.map(({ match, snapshot, tournamentName }) => {
                const isCourtLive = match.status === "live";
                const isCourtFinished = match.status === "finished";
                const currentScore = match.games[match.games.length - 1] ?? { a: 0, b: 0 };
                const pressure = pressurePoint(match.games);
                const gameNum = match.games.length || 1;

                return (
                  <article
                    key={`${snapshot.slug}-${match.id}`}
                    aria-label={`Court ${match.court ?? "queue"}: ${sideName(match, "a")} versus ${sideName(match, "b")}`}
                    className="group relative flex flex-col rounded-2xl border border-off-white/10 bg-black/60 p-5 transition-all hover:border-court-green/50 hover:bg-black/80"
                  >
                    <Link
                      href={`/tournaments/${snapshot.slug}/live/${match.id}`}
                      className="absolute inset-0 z-10 rounded-2xl focus-visible:outline-2 focus-visible:outline-court-green"
                    >
                      <span className="sr-only">Open scoreboard for match</span>
                    </Link>

                    {/* Card Header */}
                    <div className="flex items-center justify-between gap-3 border-b border-off-white/10 pb-3">
                      <div className="flex items-center gap-2">
                        {isCourtLive && (
                          <span className="size-2 rounded-full bg-court-green animate-pulse motion-reduce:animate-none" />
                        )}
                        <span className="font-display text-xs font-bold tracking-[0.15em] uppercase text-off-white">
                          {match.court ? `Court ${match.court}` : "Upcoming"}
                        </span>
                      </div>
                      <span className="max-w-[12rem] truncate font-display text-xs text-muted uppercase">
                        {match.event}
                      </span>
                    </div>

                    {selectedTournament === "all" && (
                      <p className="mt-2 text-xs font-medium text-court-green/90">
                        {tournamentName}
                      </p>
                    )}

                    {/* Players & Scores */}
                    <div className="mt-4 space-y-3">
                      {(["a", "b"] as const).map((side) => {
                        const isServing = isCourtLive && match.server === side;
                        const isWon = isCourtFinished && match.winner === side;

                        return (
                          <div key={side} className="grid grid-cols-[1fr_auto_3.5rem] items-center gap-3">
                            <div className="flex min-w-0 items-center gap-2">
                              <span
                                className={`size-2 shrink-0 rounded-full transition-colors ${
                                  isServing ? "bg-court-green" : "bg-transparent"
                                }`}
                              />
                              <span
                                className={`truncate font-display font-semibold uppercase ${
                                  isWon ? "text-court-green" : "text-off-white"
                                }`}
                              >
                                {sideName(match, side)}
                              </span>
                            </div>

                            {/* Completed Games */}
                            <span className="flex gap-1.5 font-display text-xs tabular-nums text-muted">
                              {match.games.filter((g) => gameWinner(g)).map((g, idx) => (
                                <span
                                  key={idx}
                                  className={gameWinner(g) === side ? "font-bold text-off-white" : ""}
                                >
                                  {g[side]}
                                </span>
                              ))}
                            </span>

                            {/* Live Running Score */}
                            {isCourtLive ? (
                              <RollingScore
                                value={currentScore[side]}
                                game={gameNum}
                                className="justify-end text-right font-display text-3xl font-bold tabular-nums"
                              />
                            ) : isCourtFinished ? (
                              <span className="text-right font-display text-xl font-bold tabular-nums text-muted">
                                {gamesWon(match.games, side)}
                              </span>
                            ) : (
                              <span className="text-right font-display text-xs text-muted">—</span>
                            )}
                          </div>
                        );
                      })}
                    </div>

                    {/* Card Footer */}
                    <div className="mt-auto flex items-center justify-between border-t border-off-white/10 pt-4 text-xs tracking-[0.15em] uppercase">
                      <span className="text-muted">
                        {isCourtLive
                          ? `Game ${gameNum} · ${gamesWon(match.games, "a")}–${gamesWon(match.games, "b")}`
                          : isCourtFinished
                          ? "Finished"
                          : match.round}
                      </span>
                      {pressure && isCourtLive && (
                        <span className="badge-pop rounded-lg bg-court-green px-2 py-0.5 font-display text-xs font-semibold text-black">
                          {pressure.kind === "match" ? "Match Point" : "Game Point"}
                        </span>
                      )}
                      {isCourtFinished && match.winner && (
                        <span className="font-display font-semibold text-court-green">
                          Winner: {sideName(match, match.winner)}
                        </span>
                      )}
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Rail: Up Next & Results Stream */}
        <aside className="space-y-8">
          {/* Up Next Queue */}
          <section
            aria-labelledby="queue-heading"
            className={`rounded-2xl border border-off-white/10 bg-black/40 p-6 ${
              activeMobileTab !== "queue" ? "hidden lg:block" : ""
            }`}
          >
            <div className="flex items-center justify-between border-b border-off-white/10 pb-4">
              <div className="flex items-center gap-2">
                <Clock aria-hidden="true" className="size-4 text-court-green" />
                <h2 id="queue-heading" className="font-display text-xs font-bold tracking-[0.2em] uppercase">
                  Order of Play · Next Up
                </h2>
              </div>
              <span className="rounded-full bg-off-white/10 px-2 py-0.5 font-display text-xs font-semibold tabular-nums text-muted">
                {scheduledMatches.length}
              </span>
            </div>

            {scheduledMatches.length === 0 ? (
              <p className="mt-4 text-sm text-muted">No matches scheduled in queue.</p>
            ) : (
              <ol className="mt-4 divide-y divide-off-white/10">
                {scheduledMatches.slice(0, 8).map(({ match, tournamentName }, i) => (
                  <li key={match.id} className="grid grid-cols-[1.75rem_1fr] gap-3 py-3.5 text-sm">
                    <span className="font-display text-xs text-muted tabular-nums">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <div className="min-w-0">
                      <div className="truncate font-semibold uppercase">
                        {sideName(match, "a")}
                        <span className="text-muted font-normal lowercase"> vs </span>
                        {sideName(match, "b")}
                      </div>
                      <div className="mt-1 flex items-center justify-between text-xs text-muted">
                        <span>{match.event} · {match.round}</span>
                        {selectedTournament === "all" && <span className="text-court-green/80">{tournamentName}</span>}
                      </div>
                    </div>
                  </li>
                ))}
              </ol>
            )}
          </section>

          {/* Latest Results Stream */}
          <section
            aria-labelledby="results-heading"
            className={`rounded-2xl border border-off-white/10 bg-black/40 p-6 ${
              activeMobileTab !== "results" ? "hidden lg:block" : ""
            }`}
          >
            <div className="flex items-center justify-between border-b border-off-white/10 pb-4">
              <div className="flex items-center gap-2">
                <Trophy aria-hidden="true" className="size-4 text-court-green" />
                <h2 id="results-heading" className="font-display text-xs font-bold tracking-[0.2em] uppercase">
                  Completed Results
                </h2>
              </div>
              <span className="rounded-full bg-off-white/10 px-2 py-0.5 font-display text-xs font-semibold tabular-nums text-muted">
                {finishedMatches.length}
              </span>
            </div>

            {finishedMatches.length === 0 ? (
              <p className="mt-4 text-sm text-muted">No matches completed yet.</p>
            ) : (
              <ol className="mt-4 divide-y divide-off-white/10">
                {finishedMatches.slice(0, 8).map(({ match, tournamentName }) => {
                  const winner = match.winner ?? "a";
                  const loser = winner === "a" ? "b" : "a";

                  return (
                    <li key={match.id} className="py-3.5 text-sm">
                      <div className="flex items-baseline justify-between gap-2">
                        <span className="font-semibold text-court-green uppercase truncate">
                          {sideName(match, winner)}
                        </span>
                        <span className="shrink-0 font-display text-xs font-bold tabular-nums text-off-white">
                          {scoreLine(match)}
                        </span>
                      </div>
                      <div className="mt-1 flex items-center justify-between text-xs text-muted">
                        <span className="truncate">def. {sideName(match, loser)}</span>
                        <span>{match.event}{selectedTournament === "all" ? ` · ${tournamentName}` : ""}</span>
                      </div>
                    </li>
                  );
                })}
              </ol>
            )}
          </section>
        </aside>
      </div>
    </div>
  );
}
