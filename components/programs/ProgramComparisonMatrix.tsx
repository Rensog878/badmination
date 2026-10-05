"use client";

import { Check, Minus, Zap, Shield, Trophy } from "lucide-react";

export default function ProgramComparisonMatrix() {
  const tiers = [
    {
      name: "Junior Foundation",
      level: "Beginner · Ages 7–12",
      icon: Shield,
      ratio: "1 : 8",
      sessions: "2 / week",
      shuttles: "Yonex Mavis 350",
      videoAnalysis: false,
      footworkTesting: true,
      tournamentCircuit: false,
      dietGuidance: false,
      border: "border-off-white/10",
      highlight: false,
    },
    {
      name: "Junior Development",
      level: "Intermediate · Ages 11–16",
      icon: Zap,
      ratio: "1 : 8",
      sessions: "3 / week",
      shuttles: "Yonex AS-20 Feather",
      videoAnalysis: true,
      footworkTesting: true,
      tournamentCircuit: true,
      dietGuidance: false,
      border: "border-off-white/20",
      highlight: false,
    },
    {
      name: "Elite Tournament Squad",
      level: "Advanced · Trial Entry",
      icon: Trophy,
      ratio: "1 : 6",
      sessions: "5 / week",
      shuttles: "Yonex AS-30 Tour Feather",
      videoAnalysis: true,
      footworkTesting: true,
      tournamentCircuit: true,
      dietGuidance: true,
      border: "border-court-green/60",
      highlight: true,
    },
  ];

  return (
    <div className="rounded-2xl border border-off-white/10 bg-black/70 p-6 sm:p-8 backdrop-blur-xl">
      <div className="border-b border-off-white/10 pb-4">
        <span className="font-mono text-xs font-bold uppercase tracking-wider text-court-green">
          Side-By-Side Comparison
        </span>
        <h3 className="mt-1 font-display text-xl sm:text-2xl font-black uppercase text-off-white">
          Academy Track Comparison Matrix
        </h3>
        <p className="mt-1 text-xs text-muted">
          Compare session frequency, coach-to-student ratios, feather grades, and tactical support
        </p>
      </div>

      <div className="mt-6 overflow-x-auto">
        <table className="w-full min-w-[36rem] text-left text-sm border-collapse">
          <thead>
            <tr className="border-b border-off-white/10">
              <th scope="col" className="py-4 pr-4 font-display text-xs uppercase tracking-wider text-muted font-bold">
                Feature / Metric
              </th>
              {tiers.map((tier) => {
                const Icon = tier.icon;
                return (
                  <th
                    key={tier.name}
                    scope="col"
                    className={`py-4 px-4 font-display text-xs uppercase tracking-wider ${
                      tier.highlight ? "text-court-green" : "text-off-white"
                    }`}
                  >
                    <div className="flex items-center gap-1.5 font-black text-sm">
                      <Icon className="size-4 shrink-0" />
                      <span>{tier.name}</span>
                    </div>
                    <p className="text-[10px] text-muted font-normal lowercase tracking-normal mt-0.5">
                      {tier.level}
                    </p>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody className="divide-y divide-off-white/5 font-display text-xs">
            <tr>
              <td className="py-3.5 pr-4 text-muted font-semibold">Weekly Sessions</td>
              {tiers.map((t) => (
                <td key={t.name} className="py-3.5 px-4 font-bold text-off-white">
                  {t.sessions}
                </td>
              ))}
            </tr>
            <tr>
              <td className="py-3.5 pr-4 text-muted font-semibold">Coach-to-Player Ratio</td>
              {tiers.map((t) => (
                <td key={t.name} className="py-3.5 px-4 font-bold text-off-white">
                  {t.ratio} Max
                </td>
              ))}
            </tr>
            <tr>
              <td className="py-3.5 pr-4 text-muted font-semibold">Training Shuttlecock Grade</td>
              {tiers.map((t) => (
                <td key={t.name} className="py-3.5 px-4 text-off-white/90">
                  {t.shuttles}
                </td>
              ))}
            </tr>
            <tr>
              <td className="py-3.5 pr-4 text-muted font-semibold">Slow-Motion Video Analysis</td>
              {tiers.map((t) => (
                <td key={t.name} className="py-3.5 px-4">
                  {t.videoAnalysis ? (
                    <span className="inline-flex items-center gap-1 text-court-green font-bold">
                      <Check className="size-4" /> Yes
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-muted">
                      <Minus className="size-4" /> No
                    </span>
                  )}
                </td>
              ))}
            </tr>
            <tr>
              <td className="py-3.5 pr-4 text-muted font-semibold">BWF 6-Corner Footwork Timing</td>
              {tiers.map((t) => (
                <td key={t.name} className="py-3.5 px-4">
                  <span className="inline-flex items-center gap-1 text-court-green font-bold">
                    <Check className="size-4" /> Yes
                  </span>
                </td>
              ))}
            </tr>
            <tr>
              <td className="py-3.5 pr-4 text-muted font-semibold">Tournament Match Planning</td>
              {tiers.map((t) => (
                <td key={t.name} className="py-3.5 px-4">
                  {t.tournamentCircuit ? (
                    <span className="inline-flex items-center gap-1 text-court-green font-bold">
                      <Check className="size-4" /> Yes
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-muted">
                      <Minus className="size-4" /> Optional
                    </span>
                  )}
                </td>
              ))}
            </tr>
            <tr>
              <td className="py-3.5 pr-4 text-muted font-semibold">Nutrition & Match Conditioning</td>
              {tiers.map((t) => (
                <td key={t.name} className="py-3.5 px-4">
                  {t.dietGuidance ? (
                    <span className="inline-flex items-center gap-1 text-court-green font-bold">
                      <Check className="size-4" /> Yes
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-muted">
                      <Minus className="size-4" /> Basic
                    </span>
                  )}
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
