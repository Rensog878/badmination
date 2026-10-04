"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowUpRight, Clock, Search, Share2, Trophy, X } from "lucide-react";
import type { LiveMatch } from "@/lib/live/types";
import { sideName } from "@/components/live/CourtCard";

interface PlayerMatchFinderProps {
  tournamentSlug: string;
  tournamentName: string;
  matches: LiveMatch[];
}

export default function PlayerMatchFinder({ tournamentSlug, tournamentName, matches }: PlayerMatchFinderProps) {
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "live" | "scheduled" | "finished">("all");

  const filteredMatches = useMemo(() => {
    const q = query.trim().toLowerCase();
    return matches.filter((m) => {
      // Status filter
      if (statusFilter !== "all" && m.status !== statusFilter) return false;
      if (!q) return true;

      // Check player names
      const aNames = m.sides.a.join(" ").toLowerCase();
      const bNames = m.sides.b.join(" ").toLowerCase();
      const eventName = m.event.toLowerCase();
      const roundName = m.round.toLowerCase();
      const courtStr = m.court ? `court ${m.court}` : "";

      return (
        aNames.includes(q) ||
        bNames.includes(q) ||
        eventName.includes(q) ||
        roundName.includes(q) ||
        courtStr.includes(q)
      );
    });
  }, [matches, query, statusFilter]);

  const handleShareMatch = (m: LiveMatch) => {
    const a = sideName(m, "a");
    const b = sideName(m, "b");
    const text = `🏸 Badminton Match: ${a} vs ${b} (${m.event} · ${m.round}) at ${tournamentName}. ${
      m.court ? `Court ${m.court}` : "Scheduled soon"
    }. Follow live score at: ${window.location.origin}/tournaments/${tournamentSlug}/live`;

    if (navigator.share) {
      navigator.share({ title: `${a} vs ${b}`, text }).catch(() => {});
    } else {
      navigator.clipboard.writeText(text);
      alert("Match details copied to clipboard!");
    }
  };

  return (
    <section aria-labelledby="finder-heading" className="mt-14 rounded-3xl border border-off-white/15 bg-charcoal/80 p-6 sm:p-10 backdrop-blur-xl">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between border-b border-off-white/10 pb-6">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-court-green/40 bg-court-green/10 px-3.5 py-1 text-xs font-bold tracking-[0.16em] text-court-green uppercase">
            <Search className="size-3.5" />
            <span>Player & Match Schedule Lookup</span>
          </div>
          <h2 id="finder-heading" className="mt-3 font-display text-2xl font-black uppercase text-off-white sm:text-3xl">
            Find My Match & Court
          </h2>
          <p className="mt-1 text-xs text-muted sm:text-sm">
            Search your name, doubles partner, or school to check match schedule, court number, and opponent.
          </p>
        </div>

        {/* Status Filter Tabs */}
        <div className="flex rounded-xl border border-off-white/15 bg-black/40 p-1 font-display text-xs font-semibold uppercase">
          {(
            [
              { id: "all", label: "All" },
              { id: "live", label: "On Court" },
              { id: "scheduled", label: "Upcoming" },
              { id: "finished", label: "Results" },
            ] as const
          ).map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setStatusFilter(tab.id)}
              className={`rounded-lg px-3 py-1.5 transition-colors ${
                statusFilter === tab.id ? "bg-court-green text-black font-bold" : "text-muted hover:text-off-white"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Search Input Box */}
      <div className="mt-6 relative">
        <Search className="absolute left-4 top-1/2 size-5 -translate-y-1/2 text-muted" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Type player name, partner, school, or court number..."
          className="w-full rounded-2xl border border-off-white/20 bg-black/80 py-4 pl-12 pr-12 text-sm sm:text-base text-off-white placeholder:text-muted focus:border-court-green focus:outline-none transition-colors shadow-inner"
        />
        {query && (
          <button
            type="button"
            onClick={() => setQuery("")}
            className="absolute right-4 top-1/2 -translate-y-1/2 rounded-full p-2 text-muted hover:text-off-white"
          >
            <X className="size-4" />
          </button>
        )}
      </div>

      {/* Match Cards List */}
      <div className="mt-6 space-y-4">
        {filteredMatches.length > 0 ? (
          filteredMatches.map((m) => {
            const isLive = m.status === "live";
            const isFinished = m.status === "finished";
            const current = m.games[m.games.length - 1] ?? { a: 0, b: 0 };

            return (
              <div
                key={m.id}
                className={`flex flex-col justify-between gap-4 rounded-2xl border p-5 transition-all duration-300 ${
                  isLive
                    ? "border-court-green/60 bg-gradient-to-r from-court-green/[0.08] via-black to-black shadow-[0_4px_25px_rgba(16,185,129,0.15)]"
                    : "border-off-white/10 bg-black/60 hover:border-off-white/25"
                } sm:flex-row sm:items-center`}
              >
                {/* Left: Court & Schedule Badge */}
                <div className="flex flex-col gap-2 min-w-0 sm:w-1/3">
                  <div className="flex items-center gap-2">
                    {isLive ? (
                      <span className="inline-flex items-center gap-1.5 rounded-full border border-court-green/50 bg-court-green/20 px-2.5 py-0.5 font-display text-[10px] font-black uppercase tracking-wider text-court-green">
                        <span className="relative flex size-2">
                          <span className="absolute inline-flex size-full animate-ping rounded-full bg-court-green opacity-75" />
                          <span className="relative inline-flex size-2 rounded-full bg-court-green" />
                        </span>
                        <span>{m.court ? `Court ${m.court} · Live` : "Live Now"}</span>
                      </span>
                    ) : isFinished ? (
                      <span className="inline-flex items-center gap-1 rounded-full border border-off-white/20 bg-off-white/10 px-2.5 py-0.5 font-display text-[10px] font-bold uppercase tracking-wider text-muted">
                        <Trophy className="size-3 text-amber-400" />
                        <span>Completed</span>
                      </span>
                    ) : m.calledToCourt ? (
                      <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-400/60 bg-amber-500/20 px-2.5 py-0.5 font-display text-[10px] font-black uppercase tracking-wider text-amber-300 animate-pulse shadow-[0_0_12px_rgba(245,158,11,0.3)]">
                        <span className="size-2 rounded-full bg-amber-400 animate-ping" />
                        <span>Court {m.calledToCourt} · REPORT NOW</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 rounded-full border border-blue-400/40 bg-blue-500/10 px-2.5 py-0.5 font-display text-[10px] font-bold uppercase tracking-wider text-blue-400">
                        <Clock className="size-3" />
                        <span>{m.court ? `Court ${m.court} · On Deck` : "Scheduled Match"}</span>
                      </span>
                    )}

                    <span className="text-xs font-semibold uppercase text-muted tracking-wider">
                      {m.round}
                    </span>
                  </div>

                  <p className="font-display text-xs font-bold uppercase tracking-wider text-off-white">
                    {m.event}
                  </p>
                </div>

                {/* Center: Competitors & Current Points */}
                <div className="flex-1 space-y-1.5 border-t sm:border-t-0 sm:border-l border-off-white/10 pt-3 sm:pt-0 sm:pl-6">
                  <div className="flex items-center justify-between gap-4">
                    <span className={`font-display text-sm font-bold uppercase ${m.winner === "a" ? "text-court-green font-black" : "text-off-white"}`}>
                      {sideName(m, "a")} {m.winner === "a" ? "👑" : ""}
                    </span>
                    <span className="font-display font-black text-base tabular-nums">
                      {isLive || isFinished ? current.a : "—"}
                    </span>
                  </div>

                  <div className="flex items-center justify-between gap-4">
                    <span className={`font-display text-sm font-bold uppercase ${m.winner === "b" ? "text-court-green font-black" : "text-off-white"}`}>
                      {sideName(m, "b")} {m.winner === "b" ? "👑" : ""}
                    </span>
                    <span className="font-display font-black text-base tabular-nums">
                      {isLive || isFinished ? current.b : "—"}
                    </span>
                  </div>
                </div>

                {/* Right: Actions */}
                <div className="flex items-center gap-2 border-t sm:border-t-0 border-off-white/10 pt-3 sm:pt-0 sm:pl-4 shrink-0">
                  <button
                    type="button"
                    onClick={() => handleShareMatch(m)}
                    title="Share match time to WhatsApp"
                    className="inline-flex size-9 items-center justify-center rounded-xl border border-off-white/15 bg-off-white/5 text-muted hover:border-court-green hover:text-off-white transition-colors"
                  >
                    <Share2 className="size-4" />
                  </button>

                  {isLive ? (
                    <Link
                      href={`/tournaments/${tournamentSlug}/live/${m.id}`}
                      className="btn-shimmer inline-flex items-center gap-1.5 rounded-xl bg-court-green px-4 py-2 font-display text-xs font-bold text-black uppercase hover:bg-off-white transition-colors shadow-md shadow-court-green/20"
                    >
                      <span>Live Court</span>
                      <ArrowUpRight className="size-3.5" />
                    </Link>
                  ) : (
                    <Link
                      href={`/tournaments/${tournamentSlug}/live`}
                      className="inline-flex items-center gap-1.5 rounded-xl border border-off-white/20 bg-off-white/5 px-3 py-2 font-display text-xs font-semibold text-off-white uppercase hover:border-court-green hover:text-court-green transition-colors"
                    >
                      <span>Track</span>
                    </Link>
                  )}
                </div>
              </div>
            );
          })
        ) : (
          <div className="rounded-2xl border border-dashed border-off-white/15 p-8 text-center text-muted">
            <p className="font-display text-base font-bold text-off-white uppercase">No matches found</p>
            <p className="mt-1 text-xs">
              No matches matched &quot;{query}&quot;. Try searching for the player&apos;s first or last name.
            </p>
          </div>
        )}
      </div>
    </section>
  );
}
