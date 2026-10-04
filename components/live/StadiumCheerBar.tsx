"use client";

import { useState, useCallback, useRef } from "react";
import { Volume2, VolumeX, Sparkles } from "lucide-react";

interface CheerReaction {
  id: string;
  emoji: string;
  label: string;
  count: number;
}

interface FloatingParticle {
  id: number;
  emoji: string;
  x: number; // percentage offset across cheer button
  delay: number;
  rotation: number;
}

const DEFAULT_REACTIONS: CheerReaction[] = [
  { id: "smash", emoji: "🏸", label: "Smash!", count: 142 },
  { id: "hot", emoji: "🔥", label: "Fire Rally!", count: 320 },
  { id: "clap", emoji: "👏", label: "Bravo!", count: 215 },
  { id: "speed", emoji: "⚡", label: "Light Speed!", count: 98 },
];

/** Synthesizes a subtle, pleasant audio chime without external MP3 dependencies */
function playStadiumChime(type: "smash" | "hot" | "clap" | "speed") {
  if (typeof window === "undefined") return;
  try {
    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.connect(gain);
    gain.connect(ctx.destination);

    const now = ctx.currentTime;
    if (type === "smash") {
      osc.frequency.setValueAtTime(320, now);
      osc.frequency.exponentialRampToValueAtTime(140, now + 0.12);
      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.12);
      osc.start(now);
      osc.stop(now + 0.12);
    } else if (type === "hot") {
      osc.frequency.setValueAtTime(440, now);
      osc.frequency.exponentialRampToValueAtTime(880, now + 0.15);
      gain.gain.setValueAtTime(0.15, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
      osc.start(now);
      osc.stop(now + 0.15);
    } else if (type === "speed") {
      osc.frequency.setValueAtTime(600, now);
      osc.frequency.exponentialRampToValueAtTime(1200, now + 0.1);
      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
      osc.start(now);
      osc.stop(now + 0.1);
    } else {
      // clap / bravo
      osc.type = "triangle";
      osc.frequency.setValueAtTime(520, now);
      gain.gain.setValueAtTime(0.18, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.08);
      osc.start(now);
      osc.stop(now + 0.08);
    }
  } catch {
    // Graceful fallback if AudioContext is blocked by browser policy
  }
}

export default function StadiumCheerBar({ matchId }: { matchId?: string }) {
  const [reactions, setReactions] = useState<CheerReaction[]>(DEFAULT_REACTIONS);
  const [particles, setParticles] = useState<FloatingParticle[]>([]);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const particleCounter = useRef(0);

  const handleCheer = useCallback(
    (reactionId: string) => {
      // Increment counter locally
      setReactions((prev) =>
        prev.map((r) => (r.id === reactionId ? { ...r, count: r.count + 1 } : r))
      );

      const targetReaction = reactions.find((r) => r.id === reactionId);
      if (!targetReaction) return;

      // Audio chime
      if (soundEnabled) {
        playStadiumChime(reactionId as "smash" | "hot" | "clap" | "speed");
      }

      // Haptic feedback if supported on mobile
      if (typeof navigator !== "undefined" && "vibrate" in navigator) {
        try {
          navigator.vibrate?.(25);
        } catch {
          // ignore
        }
      }

      // Spawn 2-3 floating particles
      const newParticles: FloatingParticle[] = Array.from({ length: 3 }, (_, idx) => {
        particleCounter.current += 1;
        return {
          id: particleCounter.current,
          emoji: targetReaction.emoji,
          x: (Math.random() - 0.5) * 60, // random sway
          delay: idx * 60,
          rotation: (Math.random() - 0.5) * 40,
        };
      });

      setParticles((prev) => [...prev, ...newParticles]);

      // Remove particles after animation finishes (1.4s)
      setTimeout(() => {
        setParticles((prev) =>
          prev.filter((p) => !newParticles.some((np) => np.id === p.id))
        );
      }, 1400);
    },
    [reactions, soundEnabled]
  );

  return (
    <div data-match-id={matchId} className="relative mt-6 rounded-2xl border border-off-white/10 bg-black/60 p-4 sm:p-5 backdrop-blur-xl shadow-xl">
      {/* Floating particles container */}
      <div className="pointer-events-none absolute inset-x-0 bottom-full h-48 overflow-hidden">
        {particles.map((p) => (
          <div
            key={p.id}
            className="absolute bottom-0 text-2xl sm:text-3xl animate-float-fade"
            style={{
              left: `calc(50% + ${p.x}px)`,
              transform: `rotate(${p.rotation}deg)`,
              animationDuration: "1.3s",
              animationTimingFunction: "cubic-bezier(0.2, 0.8, 0.2, 1)",
            }}
          >
            {p.emoji}
          </div>
        ))}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Sparkles className="size-4 text-amber-400 animate-pulse" />
          <span className="font-display text-xs font-bold tracking-[0.16em] uppercase text-off-white">
            Live Spectator Cheer Arena
          </span>
          <span className="hidden sm:inline-block text-[11px] text-muted">· Tap to cheer for the players</span>
        </div>

        <button
          type="button"
          onClick={() => setSoundEnabled((v) => !v)}
          title={soundEnabled ? "Mute cheer sound effects" : "Enable cheer sound effects"}
          className="flex items-center gap-1.5 rounded-lg border border-off-white/10 bg-off-white/5 px-2.5 py-1 text-[11px] font-semibold text-muted hover:text-off-white transition-colors"
        >
          {soundEnabled ? (
            <>
              <Volume2 className="size-3.5 text-court-green" />
              <span>FX On</span>
            </>
          ) : (
            <>
              <VolumeX className="size-3.5 text-muted" />
              <span>FX Muted</span>
            </>
          )}
        </button>
      </div>

      {/* Cheer Button Pills Grid */}
      <div className="mt-3.5 grid grid-cols-2 gap-2.5 sm:grid-cols-4">
        {reactions.map((r) => (
          <button
            key={r.id}
            type="button"
            onClick={() => handleCheer(r.id)}
            className="group relative flex items-center justify-between rounded-xl border border-off-white/10 bg-off-white/[0.04] p-3 text-left transition-all duration-200 hover:-translate-y-0.5 hover:border-court-green/50 hover:bg-court-green/[0.08] active:scale-95 active:bg-court-green/20"
          >
            <div className="flex items-center gap-2.5">
              <span className="text-xl sm:text-2xl transition-transform duration-200 group-hover:scale-125 group-active:scale-90">
                {r.emoji}
              </span>
              <div>
                <p className="font-display text-xs font-bold text-off-white group-hover:text-court-green transition-colors">
                  {r.label}
                </p>
                <p className="font-display text-[10px] text-muted tabular-nums">
                  {r.count.toLocaleString()} cheers
                </p>
              </div>
            </div>

            <span className="text-xs text-muted/50 group-hover:text-court-green transition-colors font-display">
              +1
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
