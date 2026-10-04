"use client";

import { useActionState, useEffect, useState } from "react";
import {
  Plus,
  Edit2,
  Play,
  CheckCircle2,
  Trash2,
  Trophy,
  Flame,
  Clock,
  X,
  Tv,
  ArrowRight,
  Megaphone,
  Send,
  Bell,
  MessageCircle,
} from "lucide-react";
import type { FormState } from "@/app/admin/actions";
import {
  addMatchAction,
  advanceWinnerAction,
  broadcastAnnouncementAction,
  callMatchToCourtAction,
  clearAllMatchesAction,
  editMatchAction,
  quickFinishMatchAction,
  quickStartMatchAction,
  removeMatchAction,
  seedDrawAction,
} from "@/app/admin/live-actions";
import type { LiveMatch } from "@/lib/live/types";

interface MatchManagerProps {
  slug: string;
  tournamentName: string;
  events: string[];
  matches: LiveMatch[];
  isDemo: boolean;
  activeAnnouncement?: string | null;
  courts?: number;
}

const ROUND_PRESETS = [
  "Quarter-Finals",
  "Semi-Finals",
  "Championship Final",
  "Round of 16",
  "Round of 32",
  "Group Stage",
];

export default function MatchManager({
  slug,
  tournamentName,
  events,
  matches,
  isDemo,
  activeAnnouncement = null,
  courts = 4,
}: MatchManagerProps) {
  const [filter, setFilter] = useState<"all" | "live" | "scheduled" | "finished">("all");
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingMatchId, setEditingMatchId] = useState<string | null>(null);
  const [announcementText, setAnnouncementText] = useState("");
  const [callCourtSelections, setCallCourtSelections] = useState<Record<string, number>>({});

  const [broadcastState, broadcastAction, broadcastPending] = useActionState<FormState, FormData>(
    async (prev, fd) => {
      const res = await broadcastAnnouncementAction(prev, fd);
      if (res.ok) setAnnouncementText("");
      return res;
    },
    {}
  );

  const [addState, addAction, addPending] = useActionState<FormState, FormData>(
    async (prev, fd) => {
      const res = await addMatchAction(prev, fd);
      if (res.ok) setShowAddForm(false);
      return res;
    },
    {}
  );

  const [editState, editAction, editPending] = useActionState<FormState, FormData>(
    async (prev, fd) => {
      const res = await editMatchAction(prev, fd);
      if (res.ok) setEditingMatchId(null);
      return res;
    },
    {}
  );

  // Synchronize modal state with phone & browser back button
  useEffect(() => {
    if (editingMatchId || showAddForm) {
      if (typeof window !== "undefined") {
        window.history.pushState({ adminModal: true }, "");
      }
      const onPop = () => {
        setEditingMatchId(null);
        setShowAddForm(false);
      };
      window.addEventListener("popstate", onPop);
      return () => window.removeEventListener("popstate", onPop);
    }
  }, [editingMatchId, showAddForm]);

  const filteredMatches = matches.filter((m) => {
    if (filter === "all") return true;
    return m.status === filter;
  });

  const editingMatch = matches.find((m) => m.id === editingMatchId);

  const handleWhatsAppCall = (m: LiveMatch, courtNum: number) => {
    const sA = m.sides.a.join(" / ");
    const sB = m.sides.b.join(" / ");
    const msg = `🏸 *MATCH CALL - ${tournamentName}*\n\n*Court ${courtNum}* is now calling:\n*${sA}* vs *${sB}*\nEvent: ${m.event} (${m.round})\n\n👉 *Please report to Court ${courtNum} immediately!*`;
    window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, "_blank");
  };

  return (
    <div className="space-y-6">
      {/* Venue Public Address & Stadium TV Announcement Ticker Control */}
      <div className="rounded-2xl border border-amber-500/30 bg-gradient-to-r from-amber-500/[0.07] via-black/40 to-amber-500/[0.04] p-5 backdrop-blur-md">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-amber-400 text-black shadow-md shadow-amber-400/20">
              <Megaphone className="size-4 animate-bounce" />
            </span>
            <div>
              <h3 className="font-display text-sm font-extrabold tracking-wider uppercase text-off-white">
                Public Address & Arena TV Banner
              </h3>
              <p className="text-xs text-muted">
                Push instant scrolling tickers to venue Stadium Arena TVs and spectators&apos; mobile devices.
              </p>
            </div>
          </div>

          {activeAnnouncement && (
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-2 rounded-full border border-amber-500/40 bg-amber-500/20 px-3 py-1 font-display text-xs font-bold text-amber-300 uppercase">
                <span className="size-2 rounded-full bg-amber-400 animate-ping" />
                Active on Screens
              </span>
              <form action={broadcastAction}>
                <input type="hidden" name="slug" value={slug} />
                <input type="hidden" name="message" value="" />
                <button
                  type="submit"
                  disabled={broadcastPending}
                  className="rounded-lg border border-red-500/30 bg-red-500/10 px-2.5 py-1 text-xs font-bold text-red-300 hover:bg-red-500 hover:text-black transition-colors"
                >
                  Clear Screen
                </button>
              </form>
            </div>
          )}
        </div>

        {activeAnnouncement && (
          <div className="mt-3 rounded-xl border border-amber-400/30 bg-amber-400/10 px-4 py-2.5 text-xs font-semibold text-amber-200">
            📢 Now Displaying: &quot;{activeAnnouncement}&quot;
          </div>
        )}

        <form action={broadcastAction} className="mt-4 flex flex-col gap-2 sm:flex-row">
          <input type="hidden" name="slug" value={slug} />
          <input
            name="message"
            value={announcementText}
            onChange={(e) => setAnnouncementText(e.target.value)}
            placeholder="Type custom announcement (e.g. Warm-up starting in 5 minutes on Court 3)..."
            className="min-h-11 flex-1 rounded-xl border border-white/15 bg-black/50 px-3.5 py-2 text-sm text-off-white placeholder:text-muted/60 focus:border-amber-400 focus:outline-none"
          />
          <button
            type="submit"
            disabled={broadcastPending}
            className="btn-shimmer inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-amber-400 px-5 py-2 font-display text-xs font-black tracking-wider uppercase text-black hover:bg-white disabled:opacity-50 transition-all shadow-md shadow-amber-400/20"
          >
            <Send className="size-3.5" />
            <span>{broadcastPending ? "Broadcasting…" : "Broadcast to TVs"}</span>
          </button>
        </form>

        {broadcastState.ok && <p className="mt-2 text-xs text-court-green">{broadcastState.ok}</p>}
        {broadcastState.error && <p className="mt-2 text-xs text-red-400">{broadcastState.error}</p>}

        {/* Quick Presets */}
        <div className="mt-3 flex flex-wrap items-center gap-1.5">
          <span className="text-[10px] font-bold text-muted uppercase tracking-wider mr-1">Quick Presets:</span>
          {[
            "🏸 Warm-up session starting in 5 minutes on all courts",
            "☕ Lunch Break: Matches resume promptly at 2:00 PM",
            "🏆 Prize Presentation Ceremony starting on Court 1",
            "📢 Paging All Quarter-Finalists to report to desk",
            "🚨 Shuttlecock & Stringing Desk is now open",
          ].map((preset) => (
            <button
              key={preset}
              type="button"
              onClick={() => setAnnouncementText(preset)}
              className="rounded-lg border border-white/10 bg-white/5 px-2.5 py-1 text-[11px] text-muted hover:border-amber-400/50 hover:text-off-white transition-colors"
            >
              {preset.split(":")[0]}
            </button>
          ))}
        </div>
      </div>

      {/* Top Banner & Control Bar */}
      <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-5 backdrop-blur-md">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span
                className={`size-2 rounded-full ${
                  isDemo ? "bg-amber-400" : "bg-court-green shadow-[0_0_8px_rgba(16,185,129,0.8)]"
                }`}
              />
              <span className="font-display text-xs font-bold tracking-[0.18em] uppercase text-muted">
                {isDemo ? "Simulated Demo Active" : "Live Database Feed"}
              </span>
            </div>
            <h2 className="mt-1 font-display text-xl font-black uppercase text-off-white">
              Match & Draw Control
            </h2>
            <p className="text-xs text-muted">
              {matches.length} matches recorded for {tournamentName}. Every match is fully editable.
            </p>
          </div>

          {/* Action buttons */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setShowAddForm(!showAddForm)}
              className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-court-green px-4 py-2 font-display text-xs font-bold tracking-[0.14em] text-black uppercase transition-all hover:bg-off-white"
            >
              <Plus className="size-4" />
              <span>{showAddForm ? "Close Form" : "Add Match"}</span>
            </button>

            {/* Seed Singles */}
            <form action={seedDrawAction}>
              <input type="hidden" name="slug" value={slug} />
              <input type="hidden" name="category" value="singles" />
              <button
                type="submit"
                className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-white/15 bg-white/5 px-3 py-2 font-display text-xs font-semibold tracking-[0.12em] text-off-white uppercase transition-all hover:border-court-green/50 hover:bg-court-green/10"
                title="Populate Quarter-Finals, Semi-Finals, and Championship Final for Singles"
              >
                <Trophy className="size-3.5 text-court-green" />
                <span>Seed Singles Draw</span>
              </button>
            </form>

            {/* Seed Doubles */}
            <form action={seedDrawAction}>
              <input type="hidden" name="slug" value={slug} />
              <input type="hidden" name="category" value="doubles" />
              <button
                type="submit"
                className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-white/15 bg-white/5 px-3 py-2 font-display text-xs font-semibold tracking-[0.12em] text-off-white uppercase transition-all hover:border-court-green/50 hover:bg-court-green/10"
                title="Populate Quarter-Finals, Semi-Finals, and Championship Final for Doubles"
              >
                <Trophy className="size-3.5 text-court-green" />
                <span>Seed Doubles Draw</span>
              </button>
            </form>

            {/* Clear All */}
            {matches.length > 0 && (
              <form
                action={clearAllMatchesAction}
                onSubmit={(e) => {
                  if (!confirm("Are you sure you want to clear all matches for this tournament?")) {
                    e.preventDefault();
                  }
                }}
              >
                <input type="hidden" name="slug" value={slug} />
                <button
                  type="submit"
                  className="inline-flex min-h-11 items-center gap-1.5 rounded-xl border border-red-500/20 px-3 py-2 font-display text-xs font-semibold tracking-[0.12em] text-red-400 uppercase transition-all hover:bg-red-500/10"
                >
                  <Trash2 className="size-3.5" />
                  <span>Clear All</span>
                </button>
              </form>
            )}
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="mt-5 flex flex-wrap items-center gap-2 border-t border-white/10 pt-4">
          <span className="font-display text-xs font-bold tracking-[0.14em] text-muted uppercase">
            Filter:
          </span>
          {(["all", "live", "scheduled", "finished"] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setFilter(t)}
              className={`rounded-lg px-3 py-1 font-display text-xs font-semibold tracking-[0.14em] uppercase transition-all ${
                filter === t
                  ? "bg-court-green text-black"
                  : "bg-white/5 text-muted hover:bg-white/10 hover:text-off-white"
              }`}
            >
              {t} ({matches.filter((m) => (t === "all" ? true : m.status === t)).length})
            </button>
          ))}
        </div>
      </div>

      {/* Add Match Form Modal/Drawer */}
      {showAddForm && (
        <div className="rounded-2xl border border-court-green/30 bg-black/80 p-6 shadow-2xl backdrop-blur-xl animate-fade-in">
          <div className="flex items-center justify-between border-b border-white/10 pb-3">
            <h3 className="font-display text-base font-bold tracking-[0.14em] uppercase text-off-white">
              Create New Match
            </h3>
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              className="rounded-lg p-1 text-muted hover:bg-white/10 hover:text-off-white"
            >
              <X className="size-5" />
            </button>
          </div>

          <form action={addAction} className="mt-5 space-y-4">
            <input type="hidden" name="slug" value={slug} />

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1 block font-display text-xs font-semibold tracking-[0.14em] text-muted uppercase">
                  Event
                </label>
                <select
                  name="event"
                  defaultValue={events[0] ?? "Open Singles"}
                  className="min-h-11 w-full rounded-xl border border-white/15 bg-charcoal px-3 py-2 text-sm text-off-white focus:border-court-green focus:outline-none"
                >
                  {events.map((ev) => (
                    <option key={ev} value={ev}>
                      {ev}
                    </option>
                  ))}
                  <option value="Open Singles">Open Singles</option>
                  <option value="Open Doubles">Open Doubles</option>
                </select>
              </div>

              <div>
                <label className="mb-1 block font-display text-xs font-semibold tracking-[0.14em] text-muted uppercase">
                  Round
                </label>
                <input
                  name="round"
                  list="round-presets"
                  defaultValue="Quarter-Finals"
                  placeholder="e.g. Quarter-Finals, Semi-Finals, Championship Final"
                  className="min-h-11 w-full rounded-xl border border-white/15 bg-charcoal px-3 py-2 text-sm text-off-white placeholder:text-muted/60 focus:border-court-green focus:outline-none"
                />
                <datalist id="round-presets">
                  {ROUND_PRESETS.map((p) => (
                    <option key={p} value={p} />
                  ))}
                </datalist>
              </div>

              <div>
                <label className="mb-1 block font-display text-xs font-semibold tracking-[0.14em] text-muted uppercase">
                  Side A Player(s)
                </label>
                <input
                  name="a"
                  required
                  placeholder="e.g. Viktor Axelsen (or Pair: A. Rao / K. Iyer)"
                  className="min-h-11 w-full rounded-xl border border-white/15 bg-charcoal px-3 py-2 text-sm text-off-white placeholder:text-muted/60 focus:border-court-green focus:outline-none"
                />
              </div>

              <div>
                <label className="mb-1 block font-display text-xs font-semibold tracking-[0.14em] text-muted uppercase">
                  Side B Player(s)
                </label>
                <input
                  name="b"
                  required
                  placeholder="e.g. Lakshya Sen (or Pair: S. Ranki / C. Shetty)"
                  className="min-h-11 w-full rounded-xl border border-white/15 bg-charcoal px-3 py-2 text-sm text-off-white placeholder:text-muted/60 focus:border-court-green focus:outline-none"
                />
              </div>

              <div>
                <label className="mb-1 block font-display text-xs font-semibold tracking-[0.14em] text-muted uppercase">
                  Court Assignment
                </label>
                <select
                  name="court"
                  defaultValue="none"
                  className="min-h-11 w-full rounded-xl border border-white/15 bg-charcoal px-3 py-2 text-sm text-off-white focus:border-court-green focus:outline-none"
                >
                  <option value="none">Unassigned</option>
                  {[1, 2, 3, 4, 5, 6].map((c) => (
                    <option key={c} value={c}>
                      Court {c}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1 block font-display text-xs font-semibold tracking-[0.14em] text-muted uppercase">
                  Status
                </label>
                <select
                  name="status"
                  defaultValue="scheduled"
                  className="min-h-11 w-full rounded-xl border border-white/15 bg-charcoal px-3 py-2 text-sm text-off-white focus:border-court-green focus:outline-none"
                >
                  <option value="scheduled">Scheduled</option>
                  <option value="live">Live in play</option>
                  <option value="finished">Finished</option>
                </select>
              </div>

              {/* Live Stream / Highlight URL */}
              <div className="sm:col-span-2">
                <label className="mb-1 block font-display text-xs font-semibold tracking-[0.14em] text-muted uppercase">
                  Live Stream or Video Highlight URL (Optional)
                </label>
                <input
                  name="streamUrl"
                  type="url"
                  placeholder="e.g. https://www.youtube.com/watch?v=... or https://youtu.be/... (Twitch / Vimeo / MP4)"
                  className="min-h-11 w-full rounded-xl border border-white/15 bg-charcoal px-3 py-2 text-sm text-off-white placeholder:text-muted/60 focus:border-court-green focus:outline-none"
                />
                <p className="mt-1 text-[11px] text-muted">
                  YouTube Live or highlight link. Synchronized live video plays directly on the court scoreboard with zero database storage cost.
                </p>
              </div>
            </div>

            {/* Optional initial scores */}
            <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
              <p className="font-display text-xs font-bold tracking-[0.14em] text-muted uppercase">
                Scores (Optional — Games 1, 2, 3)
              </p>
              <div className="mt-2 grid grid-cols-3 gap-3">
                {[1, 2, 3].map((g) => (
                  <div key={g} className="flex items-center gap-1.5">
                    <span className="text-xs text-muted">G{g}:</span>
                    <input
                      name={`g${g}_a`}
                      type="number"
                      min="0"
                      max="30"
                      placeholder="A"
                      className="w-12 rounded-lg border border-white/15 bg-charcoal p-1.5 text-center text-xs text-off-white"
                    />
                    <span className="text-xs text-muted">-</span>
                    <input
                      name={`g${g}_b`}
                      type="number"
                      min="0"
                      max="30"
                      placeholder="B"
                      className="w-12 rounded-lg border border-white/15 bg-charcoal p-1.5 text-center text-xs text-off-white"
                    />
                  </div>
                ))}
              </div>
            </div>

            {addState.error && <p className="text-xs text-red-400">{addState.error}</p>}
            {addState.ok && <p className="text-xs text-court-green">{addState.ok}</p>}

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="rounded-xl border border-white/15 px-4 py-2 font-display text-xs uppercase text-muted hover:text-off-white"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={addPending}
                className="rounded-xl bg-court-green px-5 py-2 font-display text-xs font-bold uppercase text-black hover:bg-off-white disabled:opacity-50"
              >
                {addPending ? "Adding…" : "Save Match"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Edit Match Modal */}
      {editingMatch && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-md animate-fade-in"
          onClick={() => setEditingMatchId(null)}
        >
          <div
            className="w-full max-w-xl max-h-[90svh] overflow-y-auto rounded-2xl border border-white/20 bg-charcoal p-6 shadow-2xl backdrop-blur-2xl sm:p-8"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="size-2 rounded-full bg-court-green shadow-[0_0_8px_rgba(16,185,129,0.8)] animate-pulse" />
                  <h3 className="font-display text-base font-extrabold tracking-[0.16em] uppercase text-off-white">
                    Edit Match
                  </h3>
                </div>
                <p className="mt-0.5 text-xs text-muted">ID: {editingMatch.id}</p>
              </div>
              <button
                type="button"
                onClick={() => setEditingMatchId(null)}
                className="rounded-lg p-1 text-muted hover:bg-white/10 hover:text-off-white"
              >
                <X className="size-5" />
              </button>
            </div>

            <form action={editAction} className="mt-5 space-y-4">
              <input type="hidden" name="slug" value={slug} />
              <input type="hidden" name="id" value={editingMatch.id} />

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block font-display text-xs font-semibold tracking-[0.14em] text-muted uppercase">
                    Event
                  </label>
                  <select
                    name="event"
                    defaultValue={editingMatch.event}
                    className="min-h-11 w-full rounded-xl border border-white/15 bg-black/40 px-3 py-2 text-sm text-off-white focus:border-court-green focus:outline-none"
                  >
                    {events.map((ev) => (
                      <option key={ev} value={ev}>
                        {ev}
                      </option>
                    ))}
                    <option value="Open Singles">Open Singles</option>
                    <option value="Open Doubles">Open Doubles</option>
                  </select>
                </div>

                <div>
                  <label className="mb-1 block font-display text-xs font-semibold tracking-[0.14em] text-muted uppercase">
                    Round
                  </label>
                  <input
                    name="round"
                    list="round-presets-edit"
                    defaultValue={editingMatch.round}
                    placeholder="e.g. Quarter-Finals, Semi-Finals, Championship Final"
                    className="min-h-11 w-full rounded-xl border border-white/15 bg-black/40 px-3 py-2 text-sm text-off-white focus:border-court-green focus:outline-none"
                  />
                  <datalist id="round-presets-edit">
                    {ROUND_PRESETS.map((p) => (
                      <option key={p} value={p} />
                    ))}
                  </datalist>
                </div>

                <div>
                  <label className="mb-1 block font-display text-xs font-semibold tracking-[0.14em] text-muted uppercase">
                    Side A Player(s)
                  </label>
                  <input
                    name="a"
                    required
                    defaultValue={editingMatch.sides.a.join(" / ")}
                    className="min-h-11 w-full rounded-xl border border-white/15 bg-black/40 px-3 py-2 text-sm text-off-white focus:border-court-green focus:outline-none"
                  />
                </div>

                <div>
                  <label className="mb-1 block font-display text-xs font-semibold tracking-[0.14em] text-muted uppercase">
                    Side B Player(s)
                  </label>
                  <input
                    name="b"
                    required
                    defaultValue={editingMatch.sides.b.join(" / ")}
                    className="min-h-11 w-full rounded-xl border border-white/15 bg-black/40 px-3 py-2 text-sm text-off-white focus:border-court-green focus:outline-none"
                  />
                </div>

                <div>
                  <label className="mb-1 block font-display text-xs font-semibold tracking-[0.14em] text-muted uppercase">
                    Court
                  </label>
                  <select
                    name="court"
                    defaultValue={editingMatch.court ?? "none"}
                    className="min-h-11 w-full rounded-xl border border-white/15 bg-black/40 px-3 py-2 text-sm text-off-white focus:border-court-green focus:outline-none"
                  >
                    <option value="none">Unassigned</option>
                    {[1, 2, 3, 4, 5, 6, 7, 8].map((c) => (
                      <option key={c} value={c}>
                        Court {c}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-1 block font-display text-xs font-semibold tracking-[0.14em] text-muted uppercase">
                    Status
                  </label>
                  <select
                    name="status"
                    defaultValue={editingMatch.status}
                    className="min-h-11 w-full rounded-xl border border-white/15 bg-black/40 px-3 py-2 text-sm text-off-white focus:border-court-green focus:outline-none"
                  >
                    <option value="scheduled">Scheduled</option>
                    <option value="live">Live in play</option>
                    <option value="finished">Finished</option>
                  </select>
                </div>
              </div>

              {/* Game Scores */}
              <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
                <p className="font-display text-xs font-bold tracking-[0.14em] text-muted uppercase">
                  Game Scores (Best of 3)
                </p>
                <div className="mt-3 grid grid-cols-3 gap-3">
                  {[1, 2, 3].map((gIndex) => {
                    const game = editingMatch.games[gIndex - 1];
                    return (
                      <div key={gIndex} className="rounded-lg border border-white/5 bg-black/30 p-2.5">
                        <span className="block font-display text-[10px] font-bold tracking-[0.14em] text-muted uppercase">
                          Game {gIndex}
                        </span>
                        <div className="mt-1 flex items-center gap-1.5">
                          <input
                            name={`g${gIndex}_a`}
                            type="number"
                            min="0"
                            max="30"
                            defaultValue={game?.a ?? ""}
                            placeholder="A"
                            className="w-12 rounded-lg border border-white/15 bg-charcoal p-1 text-center font-display text-xs font-bold text-court-green"
                          />
                          <span className="text-xs text-muted">-</span>
                          <input
                            name={`g${gIndex}_b`}
                            type="number"
                            min="0"
                            max="30"
                            defaultValue={game?.b ?? ""}
                            placeholder="B"
                            className="w-12 rounded-lg border border-white/15 bg-charcoal p-1 text-center font-display text-xs font-bold text-off-white"
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Winner Selector */}
              <div>
                <label className="mb-1 block font-display text-xs font-semibold tracking-[0.14em] text-muted uppercase">
                  Winner
                </label>
                <select
                  name="winner"
                  defaultValue={editingMatch.winner ?? "none"}
                  className="min-h-11 w-full rounded-xl border border-white/15 bg-black/40 px-3 py-2 text-sm text-off-white focus:border-court-green focus:outline-none"
                >
                  <option value="none">Auto (determine from scores) / None</option>
                  <option value="a">Side A ({editingMatch.sides.a.join(" / ")})</option>
                  <option value="b">Side B ({editingMatch.sides.b.join(" / ")})</option>
                </select>
              </div>

              {/* Live Stream / Highlight Video URL */}
              <div>
                <label className="mb-1 block font-display text-xs font-semibold tracking-[0.14em] text-muted uppercase">
                  Live Stream or Video Highlight URL (Optional)
                </label>
                <input
                  name="streamUrl"
                  type="url"
                  defaultValue={editingMatch.streamUrl ?? ""}
                  placeholder="e.g. https://www.youtube.com/watch?v=... or https://youtu.be/... (Twitch / Vimeo / MP4)"
                  className="min-h-11 w-full rounded-xl border border-white/15 bg-black/40 px-3 py-2 text-sm text-off-white placeholder:text-muted/60 focus:border-court-green focus:outline-none"
                />
                <p className="mt-1 text-[11px] text-muted">
                  YouTube Live or recorded highlight link. Plays directly on the match scoreboard and live hub.
                </p>
              </div>

              {editState.error && <p className="text-xs text-red-400">{editState.error}</p>}
              {editState.ok && <p className="text-xs text-court-green">{editState.ok}</p>}

              <div className="flex justify-end gap-2 border-t border-white/10 pt-4">
                <button
                  type="button"
                  onClick={() => setEditingMatchId(null)}
                  className="rounded-xl border border-white/15 px-4 py-2 font-display text-xs uppercase text-muted hover:text-off-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={editPending}
                  className="rounded-xl bg-court-green px-5 py-2 font-display text-xs font-bold uppercase text-black hover:bg-off-white disabled:opacity-50"
                >
                  {editPending ? "Saving…" : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Match Cards List */}
      <div className="space-y-3">
        {filteredMatches.map((m) => {
          const sideAName = m.sides.a.join(" / ");
          const sideBName = m.sides.b.join(" / ");
          const isLive = m.status === "live";
          const isFinished = m.status === "finished";

          return (
            <div
              key={m.id}
              className={`group flex flex-col justify-between gap-4 rounded-2xl border p-4 sm:flex-row sm:items-center sm:p-5 transition-all ${
                isLive
                  ? "border-court-green/40 bg-court-green/[0.04] shadow-[0_0_20px_rgba(16,185,129,0.06)]"
                  : isFinished
                  ? "border-white/10 bg-white/[0.015]"
                  : "border-white/10 bg-white/[0.02]"
              }`}
            >
              {/* Left Column: Match Details */}
              <div className="space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  {/* Status Pill */}
                  {isLive && (
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-court-green/40 bg-court-green/15 px-2.5 py-0.5 text-[11px] font-black tracking-[0.14em] text-court-green uppercase animate-pulse">
                      <Flame className="size-3" />
                      <span>LIVE</span>
                    </span>
                  )}
                  {m.status === "scheduled" && (
                    <span className="inline-flex items-center gap-1 rounded-full border border-white/20 bg-white/5 px-2.5 py-0.5 text-[11px] font-bold tracking-[0.14em] text-muted uppercase">
                      <Clock className="size-3" />
                      <span>SCHEDULED</span>
                    </span>
                  )}
                  {isFinished && (
                    <span className="inline-flex items-center gap-1 rounded-full border border-blue-400/30 bg-blue-500/10 px-2.5 py-0.5 text-[11px] font-bold tracking-[0.14em] text-blue-300 uppercase">
                      <CheckCircle2 className="size-3" />
                      <span>FINISHED</span>
                    </span>
                  )}

                  {/* Court Pill */}
                  {m.court && (
                    <span className="rounded-md border border-white/15 bg-white/5 px-2 py-0.5 text-[11px] font-bold text-off-white">
                      CT {m.court}
                    </span>
                  )}

                  {/* Called to Court Alert Badge */}
                  {m.calledToCourt && m.status === "scheduled" && (
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-400/60 bg-amber-500/20 px-2.5 py-0.5 text-[10px] font-black tracking-wider text-amber-300 uppercase animate-pulse shadow-[0_0_12px_rgba(245,158,11,0.3)]">
                      <Bell className="size-3 animate-bounce" />
                      <span>Called: Court {m.calledToCourt}</span>
                    </span>
                  )}

                  {/* Stream Badge */}
                  {m.streamUrl && (
                    <span className="inline-flex items-center gap-1 rounded-md border border-red-500/30 bg-red-600/10 px-2 py-0.5 text-[10px] font-bold text-red-400">
                      <Tv className="size-2.5" />
                      <span>Stream Linked</span>
                    </span>
                  )}

                  {/* Event & Round */}
                  <span className="text-xs font-semibold text-muted">
                    {m.event} · {m.round}
                  </span>
                </div>

                {/* Competitors & Scores */}
                <div className="space-y-1">
                  <div className="flex items-center gap-3">
                    <span
                      className={`text-sm font-bold ${
                        m.winner === "a" ? "text-court-green underline decoration-court-green/50 underline-offset-4" : "text-off-white"
                      }`}
                    >
                      {sideAName}
                    </span>
                    {m.winner === "a" && (
                      <Trophy className="size-3.5 text-court-green inline-block" />
                    )}
                  </div>

                  <div className="flex items-center gap-3">
                    <span
                      className={`text-sm font-bold ${
                        m.winner === "b" ? "text-court-green underline decoration-court-green/50 underline-offset-4" : "text-off-white"
                      }`}
                    >
                      {sideBName}
                    </span>
                    {m.winner === "b" && (
                      <Trophy className="size-3.5 text-court-green inline-block" />
                    )}
                  </div>
                </div>

                {/* Score Line */}
                {m.games.length > 0 && (
                  <div className="flex items-center gap-2 pt-1 text-xs font-mono text-muted">
                    <span>Games:</span>
                    {m.games.map((g, idx) => (
                      <span
                        key={idx}
                        className={`rounded px-1.5 py-0.5 text-[11px] font-bold ${
                          g.a > g.b
                            ? "bg-court-green/15 text-court-green"
                            : "bg-white/10 text-off-white"
                        }`}
                      >
                        {g.a}-{g.b}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Right Column: Actions */}
              <div className="flex flex-wrap items-center gap-2 border-t border-white/5 pt-3 sm:border-t-0 sm:pt-0">
                {/* 1-Tap Call to Court + WhatsApp Dispatch (if scheduled) */}
                {m.status === "scheduled" && (
                  <div className="flex items-center gap-1.5 rounded-xl border border-amber-500/30 bg-amber-500/10 p-1">
                    <form
                      action={async (fd) => {
                        await callMatchToCourtAction(fd);
                        const c = callCourtSelections[m.id] ?? m.court ?? 1;
                        handleWhatsAppCall(m, c);
                      }}
                      className="flex items-center gap-1.5"
                    >
                      <input type="hidden" name="slug" value={slug} />
                      <input type="hidden" name="id" value={m.id} />
                      <select
                        name="court"
                        value={callCourtSelections[m.id] ?? m.court ?? 1}
                        onChange={(e) =>
                          setCallCourtSelections({ ...callCourtSelections, [m.id]: parseInt(e.target.value, 10) })
                        }
                        className="rounded-lg border border-white/15 bg-black/60 px-2 py-1 text-xs font-bold text-amber-300 focus:outline-none"
                      >
                        {Array.from({ length: Math.max(courts, 6) }, (_, i) => i + 1).map((c) => (
                          <option key={c} value={c}>
                            CT {c}
                          </option>
                        ))}
                      </select>
                      <button
                        type="submit"
                        className="inline-flex min-h-9 items-center gap-1.5 rounded-lg bg-amber-400 px-2.5 py-1 text-xs font-black tracking-wider text-black uppercase hover:bg-white transition-all shadow-sm shadow-amber-400/20"
                        title="Broadcast match call to TVs and dispatch to WhatsApp"
                      >
                        <Bell className="size-3" />
                        <span>Call to Court</span>
                      </button>
                    </form>
                    <button
                      type="button"
                      onClick={() => handleWhatsAppCall(m, callCourtSelections[m.id] ?? m.court ?? 1)}
                      className="rounded-lg p-1.5 text-emerald-400 hover:bg-emerald-400/20 transition-colors"
                      title="Share to WhatsApp"
                    >
                      <MessageCircle className="size-4" />
                    </button>
                  </div>
                )}

                {/* Quick Start (if scheduled) */}
                {m.status === "scheduled" && (
                  <form action={quickStartMatchAction}>
                    <input type="hidden" name="slug" value={slug} />
                    <input type="hidden" name="id" value={m.id} />
                    <button
                      type="submit"
                      className="inline-flex min-h-11 items-center gap-1.5 rounded-xl border border-court-green/30 bg-court-green/10 px-3 py-2 text-xs font-bold tracking-[0.12em] text-court-green uppercase transition-all hover:bg-court-green hover:text-black"
                    >
                      <Play className="size-3.5" />
                      <span>Start</span>
                    </button>
                  </form>
                )}

                {/* Quick Finish (if live) */}
                {isLive && (
                  <form action={quickFinishMatchAction}>
                    <input type="hidden" name="slug" value={slug} />
                    <input type="hidden" name="id" value={m.id} />
                    <button
                      type="submit"
                      className="inline-flex min-h-11 items-center gap-1.5 rounded-xl border border-blue-400/30 bg-blue-500/10 px-3 py-2 text-xs font-bold tracking-[0.12em] text-blue-300 uppercase transition-all hover:bg-blue-400 hover:text-black"
                    >
                      <CheckCircle2 className="size-3.5" />
                      <span>Finish</span>
                    </button>
                  </form>
                )}

                {/* 1-Tap Advance Winner to Next Round */}
                {isFinished && m.winner && !m.round.toLowerCase().includes("final") && (
                  <form action={advanceWinnerAction}>
                    <input type="hidden" name="slug" value={slug} />
                    <input type="hidden" name="id" value={m.id} />
                    <button
                      type="submit"
                      className="inline-flex min-h-11 items-center gap-1.5 rounded-xl border border-court-green/40 bg-court-green/10 px-3 py-2 text-xs font-bold tracking-[0.12em] text-court-green uppercase transition-all hover:bg-court-green hover:text-black shadow-[0_0_10px_rgba(16,185,129,0.2)]"
                      title="Advance winner to next round bracket slot"
                    >
                      <ArrowRight className="size-3.5" />
                      <span>Advance</span>
                    </button>
                  </form>
                )}

                {/* Edit Button */}
                <button
                  type="button"
                  onClick={() => setEditingMatchId(m.id)}
                  className="inline-flex min-h-11 items-center gap-1.5 rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-xs font-semibold tracking-[0.12em] text-off-white uppercase transition-all hover:border-white/30 hover:bg-white/10"
                >
                  <Edit2 className="size-3.5" />
                  <span>Edit</span>
                </button>

                {/* Remove Button */}
                <form action={removeMatchAction}>
                  <input type="hidden" name="slug" value={slug} />
                  <input type="hidden" name="id" value={m.id} />
                  <button
                    type="submit"
                    className="inline-flex min-h-11 items-center gap-1 rounded-xl p-2.5 text-muted transition-all hover:bg-red-500/10 hover:text-red-400"
                    title="Remove match"
                  >
                    <Trash2 className="size-4" />
                  </button>
                </form>
              </div>
            </div>
          );
        })}

        {filteredMatches.length === 0 && (
          <div className="rounded-2xl border border-dashed border-white/15 p-8 text-center text-sm text-muted">
            <p>No matches matching filter &quot;{filter}&quot;.</p>
            <p className="mt-2 text-xs text-muted/70">
              Click &quot;Seed Singles Draw&quot; or &quot;Add Match&quot; above to populate the tournament fixture.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
