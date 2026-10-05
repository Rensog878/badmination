"use client";

import { Thermometer, Droplets, Wind, ShieldCheck, Zap, Activity } from "lucide-react";

interface TournamentVenueSpecCardProps {
  venue: string;
  city: string;
}

export default function TournamentVenueSpecCard({ venue, city }: TournamentVenueSpecCardProps) {
  const specs = [
    {
      label: "Official Shuttlecock",
      value: "Yonex AS-30",
      sub: "Goose Feather · Speed 2",
      icon: Zap,
      color: "text-court-green",
    },
    {
      label: "Arena Temperature",
      value: "24.5°C",
      sub: "BWF Standard Indoor HVAC",
      icon: Thermometer,
      color: "text-amber-400",
    },
    {
      label: "Court Humidity",
      value: "52%",
      sub: "Optimal Feather Trajectory",
      icon: Droplets,
      color: "text-sky-400",
    },
    {
      label: "Airflow Drift Rating",
      value: "< 0.2 m/s",
      sub: "Zero Cross-Court Draft",
      icon: Wind,
      color: "text-court-green",
    },
  ];

  return (
    <div className="rounded-2xl border border-off-white/10 bg-gradient-to-br from-black/80 via-black/60 to-charcoal p-6 sm:p-7 backdrop-blur-xl">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between border-b border-off-white/10 pb-4">
        <div>
          <div className="flex items-center gap-2 text-court-green text-xs font-bold uppercase tracking-wider">
            <Activity className="size-3.5" />
            <span>Venue Conditions & Telemetry</span>
          </div>
          <h3 className="mt-1 font-display text-base sm:text-lg font-black uppercase text-off-white">
            {venue} · {city}
          </h3>
        </div>
        <span className="self-start sm:self-auto inline-flex items-center gap-1.5 rounded-full border border-court-green/30 bg-court-green/10 px-3 py-1 text-[11px] font-bold text-court-green uppercase tracking-wider">
          <ShieldCheck className="size-3" />
          <span>BWF Grade 2 Verified</span>
        </span>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {specs.map((item) => {
          const Icon = item.icon;
          return (
            <div
              key={item.label}
              className="flex flex-col justify-between rounded-xl border border-off-white/10 bg-white/[0.02] p-4"
            >
              <div className="flex items-center justify-between text-muted">
                <span className="font-display text-[10px] font-bold uppercase tracking-wider">
                  {item.label}
                </span>
                <Icon className={`size-4 ${item.color}`} />
              </div>
              <div className="mt-3">
                <p className="font-display text-xl sm:text-2xl font-black text-off-white tabular-nums">
                  {item.value}
                </p>
                <p className="mt-0.5 text-[11px] text-muted">{item.sub}</p>
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-off-white/5 bg-black/40 px-4 py-2.5 text-xs text-muted">
        <span>Court Surface: <strong className="text-off-white">Yonex 5.0mm BWF Mat</strong> over shock-absorbent timber.</span>
        <span>Stringing Desk: <strong className="text-court-green">Protech 8 Electronic</strong> (22–32 lbs).</span>
      </div>
    </div>
  );
}
