"use client";

import { useState } from "react";
import Link from "next/link";
import { Printer, ArrowLeft, Eye, Filter, Calendar, Trophy } from "lucide-react";
import type { Tournament } from "@/lib/tournaments";
import type { LiveMatch, LiveSnapshot } from "@/lib/live/types";
import { formatRange } from "@/lib/tournaments";

interface PrintViewClientProps {
  tournament: Tournament;
  snapshot: LiveSnapshot;
}

type ViewMode = "all" | "order_of_play" | "draws";

export default function PrintViewClient({ tournament, snapshot }: PrintViewClientProps) {
  const [viewMode, setViewMode] = useState<ViewMode>("all");
  const [selectedEvent, setSelectedEvent] = useState<string>("all");
  const [paperSimulation, setPaperSimulation] = useState(true);

  const events = Array.from(
    new Set(snapshot.matches.map((m) => m.event).filter(Boolean))
  );

  const filteredMatches = snapshot.matches.filter((m) => {
    if (selectedEvent !== "all" && m.event !== selectedEvent) return false;
    return true;
  });

  // Group matches by round for draw sheet
  const quarterFinals = filteredMatches.filter((m) =>
    m.round.toLowerCase().includes("quarter")
  );
  const semiFinals = filteredMatches.filter((m) =>
    m.round.toLowerCase().includes("semi")
  );
  const finals = filteredMatches.filter((m) =>
    m.round.toLowerCase().includes("final") && !m.round.toLowerCase().includes("quarter") && !m.round.toLowerCase().includes("semi")
  );

  const handlePrint = () => {
    window.print();
  };

  const todayStr = new Intl.DateTimeFormat("en-IN", {
    dateStyle: "full",
    timeStyle: "short",
    timeZone: "Asia/Kolkata",
  }).format(new Date());

  const formatScore = (m: LiveMatch) => {
    if (!m.games || m.games.length === 0) return "-";
    return m.games
      .filter((g) => g.a + g.b > 0)
      .map((g) => `${g.a}–${g.b}`)
      .join(", ");
  };

  return (
    <div className={`min-h-screen ${paperSimulation ? "bg-zinc-200 text-zinc-900" : "bg-charcoal text-off-white"}`}>
      {/* Top Floating Action Bar (Hidden when printed) */}
      <div className="no-print sticky top-0 z-40 border-b border-zinc-300 bg-white/95 px-4 py-3 shadow-md backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 text-zinc-800">
          <div className="flex items-center gap-3">
            <Link
              href={`/tournaments/${tournament.slug}/live`}
              className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-300 px-3 py-1.5 text-xs font-semibold text-zinc-700 hover:bg-zinc-100"
            >
              <ArrowLeft className="size-4" />
              <span>Back to Live</span>
            </Link>

            <span className="font-display text-sm font-bold uppercase tracking-wider text-zinc-900">
              Print & PDF Station
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* View Mode Switcher */}
            <div className="inline-flex rounded-lg border border-zinc-300 bg-zinc-100 p-0.5 text-xs font-semibold">
              <button
                type="button"
                onClick={() => setViewMode("all")}
                className={`rounded-md px-3 py-1 transition-all ${
                  viewMode === "all" ? "bg-white text-zinc-900 shadow-sm font-bold" : "text-zinc-600 hover:text-zinc-900"
                }`}
              >
                Complete Sheet
              </button>
              <button
                type="button"
                onClick={() => setViewMode("order_of_play")}
                className={`rounded-md px-3 py-1 transition-all ${
                  viewMode === "order_of_play" ? "bg-white text-zinc-900 shadow-sm font-bold" : "text-zinc-600 hover:text-zinc-900"
                }`}
              >
                Order of Play
              </button>
              <button
                type="button"
                onClick={() => setViewMode("draws")}
                className={`rounded-md px-3 py-1 transition-all ${
                  viewMode === "draws" ? "bg-white text-zinc-900 shadow-sm font-bold" : "text-zinc-600 hover:text-zinc-900"
                }`}
              >
                Draw Bracket
              </button>
            </div>

            {/* Event Filter */}
            {events.length > 1 && (
              <div className="flex items-center gap-1.5">
                <Filter className="size-3.5 text-zinc-500" />
                <select
                  value={selectedEvent}
                  onChange={(e) => setSelectedEvent(e.target.value)}
                  className="rounded-lg border border-zinc-300 bg-white px-2.5 py-1 text-xs font-semibold text-zinc-800"
                  aria-label="Filter by Event"
                >
                  <option value="all">All Events ({snapshot.matches.length})</option>
                  {events.map((ev) => (
                    <option key={ev} value={ev}>
                      {ev}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Paper Preview Theme Toggle */}
            <button
              type="button"
              onClick={() => setPaperSimulation(!paperSimulation)}
              className="inline-flex items-center gap-1 rounded-lg border border-zinc-300 px-2.5 py-1 text-xs font-medium text-zinc-700 hover:bg-zinc-100"
              title="Toggle paper vs arena screen preview"
            >
              <Eye className="size-3.5" />
              <span>{paperSimulation ? "Paper Mode" : "Dark Mode"}</span>
            </button>

            {/* Print Action Button */}
            <button
              type="button"
              onClick={handlePrint}
              className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-1.5 font-display text-xs font-bold uppercase tracking-wider text-white hover:bg-emerald-700 shadow-sm transition-all"
            >
              <Printer className="size-4" />
              <span>Print / Save PDF</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Printable Document Canvas */}
      <div className="mx-auto max-w-[210mm] p-4 sm:p-8 print:p-0 print:max-w-none">
        <div className="rounded-2xl border border-zinc-300 bg-white p-6 sm:p-10 shadow-xl print:rounded-none print:border-none print:p-0 print:shadow-none text-black">
          
          {/* Official Tournament Banner Header */}
          <header className="border-b-2 border-black pb-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.2em] text-zinc-700">
                  <span>Official Tournament Draw & Fixture Record</span>
                </div>
                <h1 className="mt-1 font-display text-2xl sm:text-3xl font-black uppercase tracking-tight text-black">
                  {tournament.name}
                </h1>
                <p className="mt-1 text-xs sm:text-sm font-medium text-zinc-700">
                  📍 {tournament.venue}, {tournament.city} · 📅 {formatRange(tournament.startDate, tournament.endDate)}
                </p>
              </div>

              <div className="text-right">
                <div className="inline-block border border-black px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider">
                  Level: {tournament.level}
                </div>
                <p className="mt-1 text-[10px] text-zinc-600">
                  Courts: {snapshot.courts} Active
                </p>
                <p className="text-[10px] text-zinc-600 font-mono">
                  Doc ID: {tournament.slug.toUpperCase()}
                </p>
              </div>
            </div>
          </header>

          {/* Section 1: Order of Play (Schedule) */}
          {(viewMode === "all" || viewMode === "order_of_play") && (
            <section className="mt-6 print-avoid-break">
              <div className="flex items-center justify-between border-b border-zinc-400 pb-2">
                <h2 className="flex items-center gap-2 font-display text-sm font-bold uppercase tracking-wider text-black">
                  <Calendar className="size-4" />
                  <span>Official Order of Play</span>
                </h2>
                <span className="text-xs text-zinc-600 font-medium">
                  {filteredMatches.length} Matches Scheduled
                </span>
              </div>

              <div className="mt-3 overflow-x-auto">
                <table className="w-full border-collapse text-left text-xs">
                  <thead>
                    <tr className="border-b-2 border-black bg-zinc-100 font-bold uppercase tracking-wider text-zinc-900">
                      <th className="py-2 px-2 w-12 text-center">Match</th>
                      <th className="py-2 px-2 w-16 text-center">Court</th>
                      <th className="py-2 px-2 w-28">Event / Round</th>
                      <th className="py-2 px-3">Team / Player A</th>
                      <th className="py-2 px-3">Team / Player B</th>
                      <th className="py-2 px-2 w-28 text-center">Status / Score</th>
                      <th className="py-2 px-2 w-24 text-center print:table-cell">Umpire</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-300">
                    {filteredMatches.map((m, idx) => {
                      const isLive = m.status === "live";
                      const isFinished = m.status === "finished";
                      const playerA = m.sides.a.join(" / ");
                      const playerB = m.sides.b.join(" / ");

                      return (
                        <tr
                          key={m.id}
                          className={`transition-colors ${
                            isLive
                              ? "bg-emerald-50/80 font-medium"
                              : idx % 2 === 0
                              ? "bg-white"
                              : "bg-zinc-50"
                          }`}
                        >
                          <td className="py-2 px-2 text-center font-mono font-bold">
                            #{idx + 1}
                          </td>
                          <td className="py-2 px-2 text-center font-bold">
                            {m.court ? `Court ${m.court}` : m.calledToCourt ? `Court ${m.calledToCourt}` : "Queue"}
                          </td>
                          <td className="py-2 px-2">
                            <span className="block font-semibold">{m.event}</span>
                            <span className="text-[10px] text-zinc-600">{m.round}</span>
                          </td>
                          <td className="py-2 px-3 font-semibold">
                            <span className={m.winner === "a" ? "font-black underline" : ""}>
                              {playerA}
                            </span>
                          </td>
                          <td className="py-2 px-3 font-semibold">
                            <span className={m.winner === "b" ? "font-black underline" : ""}>
                              {playerB}
                            </span>
                          </td>
                          <td className="py-2 px-2 text-center font-mono">
                            {isFinished ? (
                              <span className="font-bold text-zinc-900">{formatScore(m)}</span>
                            ) : isLive ? (
                              <span className="inline-block rounded bg-emerald-100 px-1.5 py-0.5 text-[10px] font-bold text-emerald-800 uppercase">
                                On Court
                              </span>
                            ) : (
                              <span className="text-[10px] text-zinc-500 uppercase">Pending</span>
                            )}
                          </td>
                          <td className="py-2 px-2 text-center">
                            <div className="h-5 border-b border-dotted border-zinc-400"></div>
                          </td>
                        </tr>
                      );
                    })}

                    {filteredMatches.length === 0 && (
                      <tr>
                        <td colSpan={7} className="py-8 text-center text-zinc-500 italic">
                          No matches currently recorded for the selected filter.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </section>
          )}

          {/* Page Break for Print when showing both views */}
          {viewMode === "all" && <div className="print-page-break my-8 border-b-2 border-dashed border-zinc-300 no-print" />}

          {/* Section 2: Knockout Draw Bracket Sheet */}
          {(viewMode === "all" || viewMode === "draws") && (
            <section className="mt-8 print-avoid-break">
              <div className="flex items-center justify-between border-b border-zinc-400 pb-2">
                <h2 className="flex items-center gap-2 font-display text-sm font-bold uppercase tracking-wider text-black">
                  <Trophy className="size-4" />
                  <span>Championship Knockout Draw Sheet</span>
                </h2>
                <span className="text-xs text-zinc-600 font-medium">
                  BWF Elimination Tree
                </span>
              </div>

              {/* Bracket Columns: Quarters -> Semis -> Final */}
              <div className="mt-4 grid grid-cols-1 gap-6 sm:grid-cols-3 print:grid-cols-3">
                {/* Quarter-Finals Column */}
                <div className="space-y-3">
                  <div className="border-b border-black pb-1 text-center">
                    <span className="font-display text-xs font-black uppercase tracking-wider">
                      Quarter-Finals
                    </span>
                  </div>
                  <div className="space-y-3">
                    {(quarterFinals.length > 0 ? quarterFinals : snapshot.matches.slice(0, 4)).map((m, i) => (
                      <div
                        key={m.id || i}
                        className="rounded border border-zinc-400 bg-zinc-50 p-2 text-xs shadow-sm print:bg-white"
                      >
                        <div className="mb-1 flex justify-between text-[10px] text-zinc-500 font-semibold">
                          <span>Match QF{i + 1}</span>
                          <span>{m.court ? `Court ${m.court}` : ""}</span>
                        </div>
                        <div className="flex justify-between font-semibold border-b border-zinc-200 pb-1">
                          <span className={m.winner === "a" ? "font-black underline" : ""}>
                            {m.sides?.a?.join(" / ") || `Seed ${i * 2 + 1}`}
                          </span>
                          <span className="font-mono tabular-nums">
                            {m.games?.[0]?.a ?? "-"}
                          </span>
                        </div>
                        <div className="flex justify-between font-semibold pt-1">
                          <span className={m.winner === "b" ? "font-black underline" : ""}>
                            {m.sides?.b?.join(" / ") || `Seed ${i * 2 + 2}`}
                          </span>
                          <span className="font-mono tabular-nums">
                            {m.games?.[0]?.b ?? "-"}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Semi-Finals Column */}
                <div className="space-y-3">
                  <div className="border-b border-black pb-1 text-center">
                    <span className="font-display text-xs font-black uppercase tracking-wider">
                      Semi-Finals
                    </span>
                  </div>
                  <div className="space-y-4 pt-3">
                    {(semiFinals.length > 0 ? semiFinals : snapshot.matches.slice(4, 6)).map((m, i) => (
                      <div
                        key={m.id || i}
                        className="rounded border border-zinc-400 bg-zinc-50 p-2.5 text-xs shadow-sm print:bg-white"
                      >
                        <div className="mb-1 flex justify-between text-[10px] text-zinc-500 font-semibold">
                          <span>Match SF{i + 1}</span>
                          <span>{m.court ? `Court ${m.court}` : ""}</span>
                        </div>
                        <div className="flex justify-between font-semibold border-b border-zinc-200 pb-1">
                          <span className={m.winner === "a" ? "font-black underline" : ""}>
                            {m.sides?.a?.join(" / ") || "Winner QF"}
                          </span>
                          <span className="font-mono tabular-nums">
                            {m.games?.[0]?.a ?? "-"}
                          </span>
                        </div>
                        <div className="flex justify-between font-semibold pt-1">
                          <span className={m.winner === "b" ? "font-black underline" : ""}>
                            {m.sides?.b?.join(" / ") || "Winner QF"}
                          </span>
                          <span className="font-mono tabular-nums">
                            {m.games?.[0]?.b ?? "-"}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Championship Final Column */}
                <div className="space-y-3">
                  <div className="border-b-2 border-black pb-1 text-center bg-zinc-100">
                    <span className="font-display text-xs font-black uppercase tracking-wider text-black">
                      Championship Final
                    </span>
                  </div>
                  <div className="pt-6">
                    {(finals.length > 0 ? finals.slice(0, 1) : snapshot.matches.slice(6, 7)).map((m, i) => (
                      <div
                        key={m.id || i}
                        className="rounded border-2 border-black bg-white p-3 text-xs shadow-md"
                      >
                        <div className="mb-1.5 flex justify-between text-[10px] text-zinc-600 font-bold uppercase tracking-wider">
                          <span>Gold Medal Match</span>
                          <span>Court 1</span>
                        </div>
                        <div className="flex justify-between font-bold border-b border-zinc-300 pb-1.5">
                          <span className={m.winner === "a" ? "font-black underline text-black" : ""}>
                            {m.sides?.a?.join(" / ") || "Finalist 1"}
                          </span>
                          <span className="font-mono tabular-nums font-black">
                            {m.games?.map((g) => g.a).join(" ") || "-"}
                          </span>
                        </div>
                        <div className="flex justify-between font-bold pt-1.5">
                          <span className={m.winner === "b" ? "font-black underline text-black" : ""}>
                            {m.sides?.b?.join(" / ") || "Finalist 2"}
                          </span>
                          <span className="font-mono tabular-nums font-black">
                            {m.games?.map((g) => g.b).join(" ") || "-"}
                          </span>
                        </div>

                        {m.winner && (
                          <div className="mt-3 rounded bg-zinc-100 p-1.5 text-center font-display text-[11px] font-black uppercase tracking-wider">
                            🏆 Champion: {m.sides[m.winner]?.join(" / ")}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </section>
          )}

          {/* Official Sign-off and Referee Verification Block (Always at bottom of print sheet) */}
          <footer className="mt-12 border-t-2 border-black pt-4 print-avoid-break">
            <div className="grid grid-cols-3 gap-6 text-xs text-zinc-800">
              <div>
                <p className="font-bold uppercase tracking-wider text-[10px] text-zinc-600">Chief Referee</p>
                <div className="mt-6 border-b border-black w-3/4"></div>
                <p className="mt-1 text-[10px] text-zinc-500">Signature / Seal</p>
              </div>

              <div>
                <p className="font-bold uppercase tracking-wider text-[10px] text-zinc-600">Tournament Director</p>
                <div className="mt-6 border-b border-black w-3/4"></div>
                <p className="mt-1 text-[10px] text-zinc-500">Match Control Desk</p>
              </div>

              <div className="text-right">
                <p className="font-bold uppercase tracking-wider text-[10px] text-zinc-600">Verification & Time</p>
                <p className="mt-1 font-mono text-[11px] text-zinc-800">{todayStr}</p>
                <p className="mt-1 text-[10px] text-zinc-500">Generated by Badmination Tournament Engine</p>
              </div>
            </div>
          </footer>

        </div>
      </div>
    </div>
  );
}
