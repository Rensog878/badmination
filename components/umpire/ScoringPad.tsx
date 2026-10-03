"use client";

import { useCallback, useEffect, useState, useTransition } from "react";
import { Check, Tv, Undo2, Volume2, VolumeX, X } from "lucide-react";
import { scoreRally, undoRally, updateCourtStreamAction } from "@/app/umpire/actions";
import { sideName } from "@/components/live/CourtCard";
import { FieldError } from "@/components/registration/FormField";
import { useLiveFeed } from "@/components/live/useLiveFeed";
import { gameWinner, gamesWon, pressurePoint, type Side } from "@/lib/live/scoring";
import type { LiveMatch, LiveSnapshot } from "@/lib/live/types";

const KEYS: Record<string, Side | "undo"> = { a: "a", b: "b", ArrowLeft: "a", ArrowRight: "b", u: "undo", Backspace: "undo" };

function playBeep(freq = 900, duration = 0.08) {
  try {
    const AudioContextClass =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(freq, ctx.currentTime);
    gain.gain.setValueAtTime(0.12, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + duration);
  } catch {
    // AudioContext blocked
  }
}

/**
 * Umpire scoring pad. Each tap is one rally; the server applies BWF scoring and
 * broadcasts it. Shows the server's confirmed state (feed + action results).
 */
export default function ScoringPad({ initial, matchId }: { initial: LiveSnapshot; matchId: string }) {
  const { snapshot } = useLiveFeed(initial.slug, initial);
  const [confirmed, setConfirmed] = useState<LiveMatch | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [showStreamDrawer, setShowStreamDrawer] = useState(false);
  const [streamInput, setStreamInput] = useState("");
  const [streamSaving, setStreamSaving] = useState(false);
  const [streamSavedMsg, setStreamSavedMsg] = useState<string | null>(null);

  const fromFeed = snapshot.matches.find((m) => m.id === matchId);
  // Prefer whichever copy has seen more rallies (action result can beat the feed).
  const match = confirmed && (!fromFeed || confirmed.history.length > fromFeed.history.length) ? confirmed : fromFeed;

  const act = useCallback(
    (what: Side | "undo") => {
      if (pending) return;
      // Haptic feedback
      if (typeof window !== "undefined" && "vibrate" in navigator) {
        navigator.vibrate?.([30]);
      }
      // Audio chime
      if (soundEnabled) {
        if (what === "undo") playBeep(420, 0.12);
        else playBeep(what === "a" ? 880 : 1040, 0.08);
      }
      setError(null);
      startTransition(async () => {
        const res = what === "undo" ? await undoRally(initial.slug, matchId) : await scoreRally(initial.slug, matchId, what);
        if (res.ok) setConfirmed(res.match);
        else setError(res.error);
      });
    },
    [pending, initial.slug, matchId, soundEnabled],
  );

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.metaKey || e.ctrlKey || e.altKey) return;
      const what = KEYS[e.key];
      if (!what) return;
      e.preventDefault();
      act(what);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [act]);

  useEffect(() => {
    if (match?.streamUrl !== undefined) {
      setStreamInput(match.streamUrl ?? "");
    }
  }, [match?.streamUrl]);

  const handleSaveStream = async (url: string | null) => {
    setStreamSaving(true);
    setStreamSavedMsg(null);
    try {
      const res = await updateCourtStreamAction(initial.slug, matchId, url);
      if (res.ok) {
        setStreamSavedMsg(url ? "Stream linked to court!" : "Stream removed.");
        setTimeout(() => setStreamSavedMsg(null), 3000);
      }
    } finally {
      setStreamSaving(false);
    }
  };

  if (!match) return <p className="text-lg">This match is no longer in the live feed.</p>;

  const finished = match.status === "finished";
  const current = match.games[match.games.length - 1] ?? { a: 0, b: 0 };
  const completed = match.games.filter((g) => gameWinner(g));
  const pressure = pressurePoint(match.games);

  // BWF Service Court Rule: Even score = Right court, Odd score = Left court
  const serverScore = current[match.server];
  const serviceCourt = serverScore % 2 === 0 ? "Right Service Court" : "Left Service Court";

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-4">
        <div>
          <p className="font-display text-xs tracking-[0.18em] text-muted uppercase">
            {match.court ? `Court ${match.court} · ` : ""}
            {match.event} · {match.round} · Game {match.games.length || 1} · Games {gamesWon(match.games, "a")}–{gamesWon(match.games, "b")}
          </p>
          {!finished && (
            <p className="mt-1 flex items-center gap-1.5 text-xs text-court-green font-medium">
              <span className="size-2 rounded-full bg-court-green animate-pulse" />
              <span>
                Server: <strong className="font-bold">{sideName(match, match.server)}</strong> · {serviceCourt} ({serverScore})
              </span>
            </p>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* Umpire Court Live Stream Button */}
          <button
            type="button"
            onClick={() => setShowStreamDrawer(!showStreamDrawer)}
            aria-label="Court live stream settings"
            className={`inline-flex min-h-11 items-center gap-2 rounded-xl border px-3 py-2 font-display text-xs font-semibold tracking-[0.14em] uppercase transition-colors ${
              match.streamUrl
                ? "border-red-500/40 bg-red-600/10 text-red-400 hover:border-red-500"
                : "border-white/10 bg-white/5 text-muted hover:border-court-green/40 hover:text-off-white"
            }`}
          >
            <Tv className="size-4" />
            <span className="hidden sm:inline">{match.streamUrl ? "Stream Linked" : "Attach Stream"}</span>
          </button>

          <button
            type="button"
            onClick={() => setSoundEnabled(!soundEnabled)}
            aria-label={soundEnabled ? "Mute scoring chimes" : "Enable scoring chimes"}
            className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 font-display text-xs font-semibold tracking-[0.14em] uppercase text-muted hover:border-court-green/40 hover:text-off-white"
          >
            {soundEnabled ? (
              <>
                <Volume2 className="size-4 text-court-green" />
                <span className="hidden sm:inline">Sound On</span>
              </>
            ) : (
              <>
                <VolumeX className="size-4 text-muted" />
                <span className="hidden sm:inline">Muted</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Expandable Court Stream Drawer */}
      {showStreamDrawer && (
        <div className="mt-3 rounded-2xl border border-white/15 bg-black/80 p-4 backdrop-blur-md animate-fade-in">
          <div className="flex items-center justify-between border-b border-white/10 pb-2">
            <div className="flex items-center gap-2">
              <Tv className="size-4 text-court-green" />
              <span className="font-display text-xs font-bold uppercase tracking-[0.14em] text-off-white">
                Court Live Stream Link
              </span>
            </div>
            <button
              type="button"
              onClick={() => setShowStreamDrawer(false)}
              className="rounded-lg p-1 text-muted hover:text-off-white"
            >
              <X className="size-4" />
            </button>
          </div>
          <p className="mt-2 text-xs text-muted">
            Streaming from your phone? Paste your YouTube Live stream link or video highlight URL here. It instantly broadcasts to all spectators on the website.
          </p>
          <div className="mt-3 flex flex-col gap-2 sm:flex-row">
            <input
              type="url"
              value={streamInput}
              onChange={(e) => setStreamInput(e.target.value)}
              placeholder="e.g. https://www.youtube.com/watch?v=... or https://youtu.be/..."
              className="min-h-11 flex-1 rounded-xl border border-white/15 bg-charcoal px-3 py-2 text-sm text-off-white placeholder:text-muted/60 focus:border-court-green focus:outline-none"
            />
            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={streamSaving || !streamInput.trim()}
                onClick={() => handleSaveStream(streamInput.trim() || null)}
                className="inline-flex min-h-11 items-center justify-center gap-1.5 rounded-xl bg-court-green px-4 py-2 font-display text-xs font-bold tracking-[0.12em] text-black uppercase hover:bg-off-white disabled:opacity-50"
              >
                <Check className="size-4" />
                <span>Save</span>
              </button>
              {match.streamUrl && (
                <button
                  type="button"
                  disabled={streamSaving}
                  onClick={() => {
                    setStreamInput("");
                    void handleSaveStream(null);
                  }}
                  className="min-h-11 rounded-xl border border-red-500/30 px-3 py-2 font-display text-xs font-bold text-red-400 hover:bg-red-500/10"
                >
                  Clear
                </button>
              )}
            </div>
          </div>
          {streamSavedMsg && <p className="mt-2 text-xs text-court-green font-medium">{streamSavedMsg}</p>}
        </div>
      )}

      {pressure && !finished && (
        <div className="mt-4 rounded-xl border border-court-green/40 bg-court-green/10 p-3 text-center animate-pulse">
          <p className="font-display text-xs font-black tracking-[0.2em] text-court-green uppercase">
            {pressure.kind === "match" ? "Match Point" : "Game Point"} for {sideName(match, pressure.side)}
          </p>
        </div>
      )}

      <div className="mt-6 grid grid-cols-2 gap-3">
        {(["a", "b"] as const).map((side) => {
          const isServer = match.server === side && !finished;
          const isPressure = pressure && pressure.side === side && !finished;
          return (
            <button
              key={side}
              type="button"
              onClick={() => act(side)}
              disabled={finished || pending || match.status !== "live"}
              aria-label={`Point to ${sideName(match, side)}. Current score ${current[side]}.`}
              className={`flex min-h-64 flex-col items-center justify-between gap-4 rounded-2xl border p-5 text-center transition-all enabled:active:scale-[0.98] disabled:opacity-60 ${
                isPressure
                  ? "border-court-green bg-court-green/10 shadow-[0_0_25px_rgba(16,185,129,0.25)]"
                  : isServer
                    ? "border-court-green/60 bg-black/70 hover:border-court-green"
                    : "border-off-white/15 bg-black/60 hover:border-off-white/40"
              }`}
            >
              <span className="flex items-center gap-2 font-display text-sm font-semibold tracking-[0.06em] uppercase sm:text-base">
                <span
                  aria-hidden="true"
                  className={`size-2.5 rounded-full ${isServer ? "bg-court-green shadow-[0_0_8px_rgba(16,185,129,0.9)]" : "bg-transparent"}`}
                />
                {sideName(match, side)}
                {isServer && (
                  <span className="rounded-md bg-court-green/20 px-1.5 py-0.5 text-[10px] font-bold text-court-green">
                    S
                  </span>
                )}
              </span>
              <span className="font-display text-[clamp(5rem,22vw,10rem)] leading-none font-bold tabular-nums">
                {current[side]}
              </span>
              <span className="flex gap-2 font-display text-sm text-muted tabular-nums">
                {completed.map((g, i) => (
                  <span key={i} className={gameWinner(g) === side ? "text-off-white font-bold" : ""}>
                    {g[side]}
                  </span>
                ))}
                <kbd className="ml-2 border border-off-white/20 px-1.5 text-xs">{side === "a" ? "A" : "B"}</kbd>
              </span>
            </button>
          );
        })}
      </div>

      <div className="mt-5 flex flex-wrap items-center justify-between gap-4">
        <button
          type="button"
          onClick={() => act("undo")}
          disabled={pending || match.history.length === 0}
          className="rounded-xl inline-flex min-h-11 items-center gap-2 border border-off-white/20 px-5 py-3 font-display text-xs font-semibold tracking-[0.18em] uppercase hover:border-off-white disabled:opacity-50"
        >
          <Undo2 aria-hidden="true" className="size-4" />
          Undo last rally <kbd className="text-muted">U</kbd>
        </button>
        <p aria-live="polite" className="font-display text-sm font-semibold tracking-[0.18em] text-court-green uppercase">
          {finished && match.winner
            ? `Match complete · ${sideName(match, match.winner)} win`
            : pressure
              ? `${pressure.kind === "match" ? "Match" : "Game"} point · ${sideName(match, pressure.side)}`
              : ""}
        </p>
      </div>
      {error && (
        <div role="alert" className="mt-4">
          <FieldError message={error} />
        </div>
      )}
    </div>
  );
}
