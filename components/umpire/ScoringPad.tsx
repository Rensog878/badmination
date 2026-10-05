"use client";

import { useCallback, useEffect, useState, useTransition } from "react";
import { Check, Mic, MicOff, ShieldAlert, Timer, Tv, Undo2, Volume2, VolumeX, X, Vibrate, VibrateOff, Hand } from "lucide-react";
import { scoreRally, undoRally, updateCourtStreamAction } from "@/app/umpire/actions";
import { sideName } from "@/components/live/CourtCard";
import { FieldError } from "@/components/registration/FormField";
import { useLiveFeed } from "@/components/live/useLiveFeed";
import { gameWinner, gamesWon, pressurePoint, type Side } from "@/lib/live/scoring";
import type { LiveMatch, LiveSnapshot } from "@/lib/live/types";
import { useStudioSettings } from "@/lib/settings";

const KEYS: Record<string, Side | "undo"> = { a: "a", b: "b", ArrowLeft: "a", ArrowRight: "b", u: "undo", Backspace: "undo" };

function triggerHaptic(type: "point" | "pressure" | "win" | "undo" | "card" | "interval", enabled: boolean) {
  if (!enabled || typeof window === "undefined" || !("vibrate" in navigator)) return;
  try {
    switch (type) {
      case "point":
        navigator.vibrate?.([28]);
        break;
      case "pressure":
        navigator.vibrate?.([40, 50, 40]);
        break;
      case "win":
        navigator.vibrate?.([60, 40, 60, 40, 100]);
        break;
      case "undo":
        navigator.vibrate?.([70]);
        break;
      case "card":
        navigator.vibrate?.([120, 60, 120]);
        break;
      case "interval":
        navigator.vibrate?.([150, 80, 150, 80, 250]);
        break;
    }
  } catch {
    // Vibration blocked or unsupported
  }
}

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

function speakBwfCall(text: string) {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
  try {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1.05;
    utterance.pitch = 1.0;
    window.speechSynthesis.speak(utterance);
  } catch {
    // speech synthesis blocked or unavailable
  }
}

/**
 * Umpire scoring pad. Each tap is one rally; the server applies BWF scoring and
 * broadcasts it. Shows the server's confirmed state (feed + action results).
 */
export default function ScoringPad({ initial, matchId }: { initial: LiveSnapshot; matchId: string }) {
  const { settings } = useStudioSettings();
  const { snapshot } = useLiveFeed(initial.slug, initial);
  const [confirmed, setConfirmed] = useState<LiveMatch | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [voiceEnabled, setVoiceEnabled] = useState(false);
  const [hapticEnabled, setHapticEnabled] = useState(true);
  const [thumbMode, setThumbMode] = useState<"off" | "right" | "left">("off");
  const [showStreamDrawer, setShowStreamDrawer] = useState(false);
  const [showCardsDrawer, setShowCardsDrawer] = useState(false);
  const [streamInput, setStreamInput] = useState("");
  const [streamSaving, setStreamSaving] = useState(false);
  const [streamSavedMsg, setStreamSavedMsg] = useState<string | null>(null);

  // Interval timer (60s mid-game at 11, 120s between games)
  const [intervalTime, setIntervalTime] = useState<number | null>(null);
  const [intervalRunning, setIntervalRunning] = useState(false);

  // Disciplinary card logs
  const [cardLogs, setCardLogs] = useState<
    { id: string; side: Side; type: "yellow" | "red" | "black"; reason: string; time: string }[]
  >([]);

  const fromFeed = snapshot.matches.find((m) => m.id === matchId);
  // Prefer whichever copy has seen more rallies (action result can beat the feed).
  const match = confirmed && (!fromFeed || confirmed.history.length > fromFeed.history.length) ? confirmed : fromFeed;

  const act = useCallback(
    (what: Side | "undo") => {
      if (pending) return;
      // Contextual tactile haptic feedback
      if (what === "undo") {
        triggerHaptic("undo", hapticEnabled);
      } else {
        const isPressure = match?.games ? Boolean(pressurePoint(match.games)) : false;
        triggerHaptic(isPressure ? "pressure" : "point", hapticEnabled);
      }
      // Audio chime
      if (soundEnabled) {
        if (what === "undo") playBeep(420, 0.12);
        else playBeep(what === "a" ? 880 : 1040, 0.08);
      }
      setError(null);
      startTransition(async () => {
        const res = what === "undo" ? await undoRally(initial.slug, matchId) : await scoreRally(initial.slug, matchId, what);
        if (res.ok) {
          setConfirmed(res.match);
          if (res.match.status === "finished") {
            triggerHaptic("win", hapticEnabled);
          }
          if (voiceEnabled && what !== "undo") {
            const currentGame = res.match.games[res.match.games.length - 1];
            if (currentGame) {
              const sScore = currentGame[res.match.server];
              const rScore = currentGame[res.match.server === "a" ? "b" : "a"];
              if (res.match.status === "finished") {
                speakBwfCall(`Match won by ${sideName(res.match, res.match.winner || "a")}`);
              } else if (sScore === 11 && rScore < 11) {
                speakBwfCall(`Interval. 11 - ${rScore}.`);
              } else {
                speakBwfCall(`${sScore} - ${rScore}`);
              }
            }
          }
        } else {
          setError(res.error);
        }
      });
    },
    [pending, initial.slug, matchId, soundEnabled, voiceEnabled, hapticEnabled, match],
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

  // Interval countdown effect
  useEffect(() => {
    if (!intervalRunning || intervalTime === null) return;
    if (intervalTime <= 0) {
      setIntervalRunning(false);
      setIntervalTime(null);
      triggerHaptic("interval", hapticEnabled);
      playBeep(980, 0.4);
      if (voiceEnabled) speakBwfCall("Time! Court, play!");
      return;
    }
    const timer = setInterval(() => {
      setIntervalTime((prev) => {
        if (prev === null) return null;
        if (prev === 21 && voiceEnabled) {
          speakBwfCall("20 seconds.");
          playBeep(660, 0.15);
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [intervalRunning, intervalTime, voiceEnabled, hapticEnabled]);

  const startInterval = (seconds: number) => {
    setIntervalTime(seconds);
    setIntervalRunning(true);
    if (voiceEnabled) speakBwfCall(`${seconds} seconds interval.`);
  };

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

  const issueDisciplinaryCard = (side: Side, type: "yellow" | "red" | "black") => {
    if (!match) return;
    triggerHaptic("card", hapticEnabled);
    const timeStr = new Date().toLocaleTimeString([], { minute: "2-digit", second: "2-digit" });
    const log = {
      id: Math.random().toString(36).slice(2, 7),
      side,
      type,
      reason:
        type === "yellow"
          ? "Warning: Delaying play or verbal misconduct"
          : type === "red"
          ? "Fault: Repeat offense (1 Penalty Point to opponent)"
          : "Disqualification (Gross misconduct / referee sanction)",
      time: timeStr,
    };
    setCardLogs((prev) => [log, ...prev]);

    if (type === "yellow") {
      playBeep(520, 0.2);
      if (voiceEnabled) speakBwfCall(`Warning. Yellow card to ${sideName(match, side)}.`);
    } else if (type === "red") {
      // Award fault point to opponent side per BWF Rule 16.7.1
      const opponentSide: Side = side === "a" ? "b" : "a";
      playBeep(320, 0.3);
      if (voiceEnabled) speakBwfCall(`Fault. Red card to ${sideName(match, side)}. Point to ${sideName(match, opponentSide)}.`);
      act(opponentSide);
    } else if (type === "black") {
      playBeep(220, 0.5);
      if (voiceEnabled) speakBwfCall(`Disqualified. Black card to ${sideName(match, side)}.`);
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
      {/* Top Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-off-white/10 pb-4">
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

        <div className="flex flex-wrap items-center gap-2">
          {/* Voice Announcements Button */}
          <button
            type="button"
            onClick={() => {
              const next = !voiceEnabled;
              setVoiceEnabled(next);
              if (next) speakBwfCall("BWF voice calls activated.");
            }}
            aria-label={voiceEnabled ? "Disable BWF voice calls" : "Enable BWF voice calls"}
            className={`inline-flex min-h-11 items-center gap-2 rounded-xl border px-3 py-2 font-display text-xs font-semibold tracking-[0.14em] uppercase transition-colors ${
              voiceEnabled
                ? "border-court-green bg-court-green/20 text-court-green"
                : "border-off-white/10 bg-off-white/5 text-muted hover:border-court-green/40 hover:text-off-white"
            }`}
          >
            {voiceEnabled ? <Mic className="size-4 text-court-green" /> : <MicOff className="size-4 text-muted" />}
            <span className="hidden sm:inline">{voiceEnabled ? "Voice ON" : "Voice Calls"}</span>
          </button>

          {/* Cards & Misconduct Drawer Button */}
          <button
            type="button"
            onClick={() => setShowCardsDrawer(!showCardsDrawer)}
            aria-label="BWF Disciplinary Cards"
            className={`inline-flex min-h-11 items-center gap-1.5 rounded-xl border px-3 py-2 font-display text-xs font-semibold tracking-[0.14em] uppercase transition-colors ${
              showCardsDrawer
                ? "border-amber-400 bg-amber-400/20 text-amber-300"
                : "border-off-white/10 bg-off-white/5 text-muted hover:border-court-green/40 hover:text-off-white"
            }`}
          >
            <ShieldAlert className="size-4" />
            <span className="hidden sm:inline">BWF Cards</span>
          </button>

          {/* Umpire Court Live Stream Button */}
          <button
            type="button"
            onClick={() => setShowStreamDrawer(!showStreamDrawer)}
            aria-label="Court live stream settings"
            className={`inline-flex min-h-11 items-center gap-2 rounded-xl border px-3 py-2 font-display text-xs font-semibold tracking-[0.14em] uppercase transition-colors ${
              match.streamUrl
                ? "border-red-500/40 bg-red-600/10 text-red-400 hover:border-red-500"
                : "border-off-white/10 bg-off-white/5 text-muted hover:border-court-green/40 hover:text-off-white"
            }`}
          >
            <Tv className="size-4" />
            <span className="hidden sm:inline">{match.streamUrl ? "Stream Linked" : "Attach Stream"}</span>
          </button>

          {/* Single-Hand Thumb Mode Button */}
          {settings.features.singleHandThumbMode && (
            <button
              type="button"
              onClick={() => {
                const next = thumbMode === "off" ? "right" : thumbMode === "right" ? "left" : "off";
                setThumbMode(next);
                triggerHaptic("point", hapticEnabled);
              }}
              aria-label="Toggle Single-Hand Ergonomic Thumb Pad"
              className={`inline-flex min-h-11 items-center gap-1.5 rounded-xl border px-3 py-2 font-display text-xs font-semibold tracking-[0.14em] uppercase transition-colors ${
                thumbMode !== "off"
                  ? "border-court-green bg-court-green/20 text-court-green shadow-[0_0_12px_rgba(16,185,129,0.3)]"
                  : "border-off-white/10 bg-off-white/5 text-muted hover:border-court-green/40 hover:text-off-white"
              }`}
              title="Toggle Single-Hand Mobile Thumb Mode (Right/Left reach)"
            >
              <Hand className="size-4" />
              <span className="hidden sm:inline">
                {thumbMode === "off" ? "Thumb Pad" : thumbMode === "right" ? "Right Thumb" : "Left Thumb"}
              </span>
            </button>
          )}

          {/* Tactile Haptic Feedback Button */}
          <button
            type="button"
            onClick={() => setHapticEnabled(!hapticEnabled)}
            aria-label={hapticEnabled ? "Disable tactile haptic feedback" : "Enable tactile haptic feedback"}
            className={`inline-flex min-h-11 items-center gap-1.5 rounded-xl border px-3 py-2 font-display text-xs font-semibold tracking-[0.14em] uppercase transition-colors ${
              hapticEnabled
                ? "border-court-green/40 bg-court-green/10 text-court-green"
                : "border-off-white/10 bg-off-white/5 text-muted hover:border-court-green/40 hover:text-off-white"
            }`}
            title="Toggle tactile haptic vibration patterns"
          >
            {hapticEnabled ? (
              <>
                <Vibrate className="size-4 text-court-green animate-pulse" />
                <span className="hidden sm:inline">Haptics ON</span>
              </>
            ) : (
              <>
                <VibrateOff className="size-4 text-muted" />
                <span className="hidden sm:inline">Haptics OFF</span>
              </>
            )}
          </button>

          {/* Audio Chime Button */}
          <button
            type="button"
            onClick={() => setSoundEnabled(!soundEnabled)}
            aria-label={soundEnabled ? "Mute scoring chimes" : "Enable scoring chimes"}
            className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-off-white/10 bg-off-white/5 px-3 py-2 font-display text-xs font-semibold tracking-[0.14em] uppercase text-muted hover:border-court-green/40 hover:text-off-white"
          >
            {soundEnabled ? (
              <>
                <Volume2 className="size-4 text-court-green" />
                <span className="hidden sm:inline">Chime</span>
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

      {/* Interval Timer Ticker */}
      <div className="mt-3 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-off-white/10 bg-off-white/[0.02] p-3 text-xs">
        <div className="flex items-center gap-2">
          <Timer className="size-4 text-court-green" />
          <span className="font-display font-bold uppercase tracking-wider text-muted">BWF Interval:</span>
          {intervalTime !== null ? (
            <span className="font-mono text-base font-bold text-court-green">
              {Math.floor(intervalTime / 60)}:{String(intervalTime % 60).padStart(2, "0")}
            </span>
          ) : (
            <span className="text-muted">Standby</span>
          )}
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => startInterval(60)}
            className="rounded-lg border border-off-white/15 bg-off-white/5 px-2.5 py-1 font-display text-[11px] font-bold uppercase text-off-white hover:border-court-green hover:text-court-green"
          >
            60s (Mid-Game)
          </button>
          <button
            type="button"
            onClick={() => startInterval(120)}
            className="rounded-lg border border-off-white/15 bg-off-white/5 px-2.5 py-1 font-display text-[11px] font-bold uppercase text-off-white hover:border-court-green hover:text-court-green"
          >
            120s (Between Games)
          </button>
          {intervalTime !== null && (
            <button
              type="button"
              onClick={() => {
                setIntervalRunning(false);
                setIntervalTime(null);
              }}
              className="rounded-lg border border-red-500/30 px-2 py-1 font-display text-[11px] font-bold text-red-400 hover:bg-red-500/10"
            >
              Reset
            </button>
          )}
        </div>
      </div>

      {/* Expandable BWF Cards Drawer */}
      {showCardsDrawer && (
        <div className="mt-3 rounded-2xl border border-amber-400/40 bg-black/90 p-4 backdrop-blur-md animate-fade-in shadow-xl">
          <div className="flex items-center justify-between border-b border-off-white/10 pb-2">
            <div className="flex items-center gap-2">
              <ShieldAlert className="size-4 text-amber-400" />
              <span className="font-display text-xs font-bold uppercase tracking-[0.14em] text-amber-400">
                Official BWF Discipline & Penalties (Law 16)
              </span>
            </div>
            <button
              type="button"
              onClick={() => setShowCardsDrawer(false)}
              className="rounded-lg p-1 text-muted hover:text-off-white"
            >
              <X className="size-4" />
            </button>
          </div>

          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            {/* Side A Actions */}
            <div className="rounded-xl border border-off-white/10 bg-off-white/[0.02] p-3">
              <p className="font-display text-xs font-bold uppercase text-off-white truncate">{sideName(match, "a")}</p>
              <div className="mt-2.5 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => issueDisciplinaryCard("a", "yellow")}
                  className="flex-1 rounded-lg bg-amber-400/20 border border-amber-400 px-2 py-1.5 font-display text-[11px] font-bold text-amber-300 uppercase hover:bg-amber-400 hover:text-black"
                >
                  🟨 Yellow (Warn)
                </button>
                <button
                  type="button"
                  onClick={() => issueDisciplinaryCard("a", "red")}
                  className="flex-1 rounded-lg bg-red-600/20 border border-red-500 px-2 py-1.5 font-display text-[11px] font-bold text-red-400 uppercase hover:bg-red-600 hover:text-white"
                >
                  🟥 Red (Fault +1)
                </button>
                <button
                  type="button"
                  onClick={() => issueDisciplinaryCard("a", "black")}
                  className="rounded-lg bg-black border border-off-white/30 px-2 py-1.5 font-display text-[11px] font-bold text-off-white uppercase hover:bg-white hover:text-black"
                >
                  ⬛ Black
                </button>
              </div>
            </div>

            {/* Side B Actions */}
            <div className="rounded-xl border border-off-white/10 bg-off-white/[0.02] p-3">
              <p className="font-display text-xs font-bold uppercase text-off-white truncate">{sideName(match, "b")}</p>
              <div className="mt-2.5 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => issueDisciplinaryCard("b", "yellow")}
                  className="flex-1 rounded-lg bg-amber-400/20 border border-amber-400 px-2 py-1.5 font-display text-[11px] font-bold text-amber-300 uppercase hover:bg-amber-400 hover:text-black"
                >
                  🟨 Yellow (Warn)
                </button>
                <button
                  type="button"
                  onClick={() => issueDisciplinaryCard("b", "red")}
                  className="flex-1 rounded-lg bg-red-600/20 border border-red-500 px-2 py-1.5 font-display text-[11px] font-bold text-red-400 uppercase hover:bg-red-600 hover:text-white"
                >
                  🟥 Red (Fault +1)
                </button>
                <button
                  type="button"
                  onClick={() => issueDisciplinaryCard("b", "black")}
                  className="rounded-lg bg-black border border-off-white/30 px-2 py-1.5 font-display text-[11px] font-bold text-off-white uppercase hover:bg-white hover:text-black"
                >
                  ⬛ Black
                </button>
              </div>
            </div>
          </div>

          {/* Sanctions Log */}
          {cardLogs.length > 0 && (
            <div className="mt-3 border-t border-off-white/10 pt-3">
              <p className="font-display text-[10px] font-bold tracking-wider uppercase text-muted">Misconduct Log:</p>
              <ul className="mt-1 space-y-1">
                {cardLogs.map((log) => (
                  <li key={log.id} className="flex items-center justify-between text-xs text-muted">
                    <span>
                      {log.type === "yellow" ? "🟨" : log.type === "red" ? "🟥" : "⬛"} {sideName(match, log.side)}: {log.reason}
                    </span>
                    <span className="font-mono text-[10px]">{log.time}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Expandable Court Stream Drawer */}
      {showStreamDrawer && (
        <div className="mt-3 rounded-2xl border border-off-white/15 bg-black/80 p-4 backdrop-blur-md animate-fade-in">
          <div className="flex items-center justify-between border-b border-off-white/10 pb-2">
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
              className="min-h-11 flex-1 rounded-xl border border-off-white/15 bg-charcoal px-3 py-2 text-sm text-off-white placeholder:text-muted/60 focus:border-court-green focus:outline-none"
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

      {/* Single-Hand Ergonomic Mobile Thumb Arc Pad */}
      {settings.features.singleHandThumbMode && thumbMode !== "off" && !finished && match.status === "live" && (
        <div
          className={`fixed bottom-4 z-50 flex flex-col gap-2 rounded-3xl border border-court-green/50 bg-black/95 p-3 backdrop-blur-2xl shadow-[0_16px_50px_rgba(0,0,0,0.9)] animate-fade-in ${
            thumbMode === "right" ? "right-4 items-end" : "left-4 items-start"
          }`}
        >
          <div className="flex items-center justify-between w-full gap-2 px-1 pb-1 border-b border-off-white/10 text-[10px] font-bold uppercase tracking-wider text-muted">
            <span className="flex items-center gap-1 text-court-green">
              <Hand className="size-3" />
              <span>{thumbMode === "right" ? "Right-Thumb" : "Left-Thumb"} Arc</span>
            </span>
            <button
              type="button"
              onClick={() => setThumbMode(thumbMode === "right" ? "left" : "off")}
              className="text-muted hover:text-off-white text-[9px] uppercase px-1 py-0.5 rounded bg-off-white/10"
            >
              {thumbMode === "right" ? "Left" : "Close"}
            </button>
          </div>

          <div className="flex gap-2">
            {/* Point to A */}
            <button
              type="button"
              onClick={() => act("a")}
              disabled={pending}
              className={`flex flex-col items-center justify-center rounded-2xl border p-3 min-w-[5.2rem] min-h-[5.2rem] active:scale-90 transition-all ${
                match.server === "a"
                  ? "border-court-green bg-court-green/20 text-court-green shadow-[0_0_20px_rgba(16,185,129,0.3)]"
                  : "border-off-white/20 bg-off-white/5 text-off-white"
              }`}
            >
              <span className="text-[10px] font-black uppercase text-court-green truncate max-w-[4.8rem]">
                {sideName(match, "a").split(" ")[0]}
              </span>
              <span className="font-display text-3xl font-black tabular-nums">{current.a}</span>
              <span className="text-[9px] font-bold uppercase tracking-widest text-muted">+1 Pt</span>
            </button>

            {/* Point to B */}
            <button
              type="button"
              onClick={() => act("b")}
              disabled={pending}
              className={`flex flex-col items-center justify-center rounded-2xl border p-3 min-w-[5.2rem] min-h-[5.2rem] active:scale-90 transition-all ${
                match.server === "b"
                  ? "border-court-green bg-court-green/20 text-court-green shadow-[0_0_20px_rgba(16,185,129,0.3)]"
                  : "border-off-white/20 bg-off-white/5 text-off-white"
              }`}
            >
              <span className="text-[10px] font-black uppercase text-court-green truncate max-w-[4.8rem]">
                {sideName(match, "b").split(" ")[0]}
              </span>
              <span className="font-display text-3xl font-black tabular-nums">{current.b}</span>
              <span className="text-[9px] font-bold uppercase tracking-widest text-muted">+1 Pt</span>
            </button>
          </div>

          {/* Quick Undo in Thumb Reach */}
          <button
            type="button"
            onClick={() => act("undo")}
            disabled={pending || match.history.length === 0}
            className="w-full flex items-center justify-center gap-1.5 rounded-xl border border-off-white/20 bg-off-white/5 py-2 font-display text-[10px] font-bold uppercase tracking-wider text-muted hover:text-off-white active:scale-95 disabled:opacity-40"
          >
            <Undo2 className="size-3" />
            <span>Undo Rally</span>
          </button>
        </div>
      )}
    </div>
  );
}
