"use client";

import { useState } from "react";
import { Zap, Target, Flame, Activity } from "lucide-react";

interface BiomechanicsStage {
  id: string;
  name: string;
  phase: string;
  apexMetric: string;
  proTip: string;
  keyDrill: string;
}

const STAGES: BiomechanicsStage[] = [
  {
    id: "split-step",
    name: "Kinetic Coil & Scissor Ascent",
    phase: "Phase 1: Launch",
    apexMetric: "110° Rear Leg Load",
    proTip: "Never jump off flat feet. Load the rear calf like a coiled spring and drive your non-racket shoulder upward to elevate your center of gravity.",
    keyDrill: "Box-jump shadow smashes with 3kg medicine ball twist.",
  },
  {
    id: "core-coil",
    name: "Thoracic Rotation & Tracking",
    phase: "Phase 2: Full Extension",
    apexMetric: "45° Hip-Shoulder Separation",
    proTip: "Keep the non-racket hand pointing at the falling cork until the final millisecond. This locks your peripheral vision and stabilizes your head in mid-air.",
    keyDrill: "High-hung shuttlecock suspended reach drill.",
  },
  {
    id: "wrist-whip",
    name: "Forearm Pronation & Snap",
    phase: "Phase 3: Impact Velocity",
    apexMetric: "410+ km/h Terminal Speed",
    proTip: "Loose grip until 5 inches before impact. Tighten on contact with rapid internal forearm rotation to generate explosive whip without straining the elbow.",
    keyDrill: "Resistance-band snap blocks and heavy-racket whip swings.",
  },
  {
    id: "recovery",
    name: "Steep Trajectory & Rebound",
    phase: "Phase 4: Court Recovery",
    apexMetric: "0.28s Recovery to T",
    proTip: "Let the racket sweep across your opposite hip to absorb momentum. Land on the front ball of the non-racket foot to spring forward toward the net kill.",
    keyDrill: "Smash-and-rush multi-shuttle feeder sprints.",
  },
];

export default function SmashBiomechanicsCard() {
  const [activeStage, setActiveStage] = useState<BiomechanicsStage>(STAGES[2]); // Default to wrist snap

  return (
    <div className="rounded-2xl border border-off-white/10 bg-gradient-to-br from-black/80 via-charcoal to-black p-6 sm:p-8 backdrop-blur-xl">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-off-white/10 pb-6">
        <div>
          <div className="flex items-center gap-2 text-court-green text-xs font-bold uppercase tracking-wider">
            <Activity className="size-4 animate-pulse" />
            <span>Masterclass Biomechanics</span>
          </div>
          <h3 className="mt-1 font-display text-xl sm:text-2xl font-black uppercase text-off-white">
            The Championship Jump Smash Blueprint
          </h3>
          <p className="mt-1 text-xs text-muted">
            Tap each kinetic phase to analyze Coach Hensiya&apos;s technical execution checkpoints
          </p>
        </div>

        <div className="inline-flex items-center gap-2 rounded-full border border-court-green/30 bg-court-green/10 px-3.5 py-1 text-xs font-bold text-court-green">
          <Zap className="size-3.5" />
          <span>BWF Pro Telemetry</span>
        </div>
      </div>

      {/* Interactive Phase Selector Pills */}
      <div className="mt-6 grid grid-cols-2 gap-2.5 sm:grid-cols-4">
        {STAGES.map((stage) => {
          const isSelected = activeStage.id === stage.id;
          return (
            <button
              key={stage.id}
              type="button"
              onClick={() => setActiveStage(stage)}
              className={`flex flex-col items-start rounded-xl p-3.5 text-left transition-all border ${
                isSelected
                  ? "border-court-green bg-court-green/15 text-off-white shadow-[0_0_15px_rgba(16,185,129,0.2)]"
                  : "border-off-white/10 bg-white/[0.02] text-muted hover:border-off-white/20 hover:text-off-white"
              }`}
            >
              <span className="font-mono text-[9px] font-bold uppercase tracking-wider text-court-green">
                {stage.phase}
              </span>
              <span className="mt-1 font-display text-xs font-bold uppercase leading-tight line-clamp-1">
                {stage.name}
              </span>
            </button>
          );
        })}
      </div>

      {/* Deep-Dive Inspection Stage Box */}
      <div className="mt-6 rounded-xl border border-court-green/20 bg-black/50 p-5 sm:p-6 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-off-white/10 pb-4">
          <div>
            <span className="font-mono text-[10px] font-bold text-court-green uppercase tracking-widest">
              {activeStage.phase} Focus
            </span>
            <h4 className="font-display text-lg sm:text-xl font-black uppercase text-off-white">
              {activeStage.name}
            </h4>
          </div>
          <div className="rounded-lg border border-amber-400/30 bg-amber-400/10 px-3 py-1 font-display text-xs font-black text-amber-300 uppercase tracking-wider">
            {activeStage.apexMetric}
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5 rounded-lg border border-off-white/5 bg-white/[0.02] p-4">
            <div className="flex items-center gap-1.5 text-xs font-bold uppercase text-court-green">
              <Target className="size-3.5" />
              <span>Coach&apos;s Technical Cue</span>
            </div>
            <p className="text-sm leading-relaxed text-off-white/90">
              {activeStage.proTip}
            </p>
          </div>

          <div className="space-y-1.5 rounded-lg border border-off-white/5 bg-white/[0.02] p-4">
            <div className="flex items-center gap-1.5 text-xs font-bold uppercase text-amber-400">
              <Flame className="size-3.5" />
              <span>Recommended Academy Drill</span>
            </div>
            <p className="text-sm leading-relaxed text-muted">
              {activeStage.keyDrill}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
