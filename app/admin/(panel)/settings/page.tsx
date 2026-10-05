"use client";

import { useState } from "react";
import { Sliders, ShieldCheck, Check, Radio, Sparkles, Activity, Users, Compass, Megaphone, Save } from "lucide-react";
import { useStudioSettings } from "@/lib/settings";

export default function AdminSettingsPage() {
  const { settings, toggleFeature } = useStudioSettings();
  const [saved, setSaved] = useState(false);
  const [announcementText, setAnnouncementText] = useState("Official Welcome: Centre Court matches streamed live in 4K. Semi-finals begin at 2:00 PM.");
  const [courtCount, setCourtCount] = useState(4);
  const [demoFeed, setDemoFeed] = useState(true);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  return (
    <div className="space-y-8 animate-fade-in max-w-4xl">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-off-white/10 pb-6">
        <div>
          <div className="flex items-center gap-2 text-court-green text-xs font-bold uppercase tracking-wider">
            <Sliders className="size-4" />
            <span>Master Governance</span>
          </div>
          <h1 className="mt-1 font-display text-2xl font-black uppercase text-off-white sm:text-3xl">
            Tournament Settings & Feature Matrix
          </h1>
          <p className="mt-1 text-xs text-muted">
            Configure tournament features, arena court counts, public announcements, and telemetry
          </p>
        </div>

        <button
          type="button"
          onClick={handleSave}
          className="flex items-center gap-2 rounded-xl bg-court-green px-5 py-2.5 font-display text-xs font-bold uppercase tracking-wider text-black hover:bg-off-white transition-all shadow-[0_0_15px_rgba(16,185,129,0.3)] self-start sm:self-auto"
        >
          {saved ? (
            <>
              <Check className="size-4" />
              <span>Settings Saved!</span>
            </>
          ) : (
            <>
              <Save className="size-4" />
              <span>Save & Apply</span>
            </>
          )}
        </button>
      </div>

      {/* Arena Venue & Capacity Section */}
      <div className="rounded-2xl border border-off-white/10 bg-black/40 p-6 space-y-5">
        <div className="border-b border-off-white/10 pb-3">
          <h2 className="font-display text-sm font-bold uppercase tracking-wider text-court-green">
            1. Arena Venue & Live Match Configuration
          </h2>
          <p className="text-xs text-muted">Manage active courts and live stream simulation</p>
        </div>

        <div className="grid gap-6 sm:grid-cols-2">
          {/* Active Courts Selector */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-off-white mb-2">
              Equipped Tournament Courts
            </label>
            <select
              value={courtCount}
              onChange={(e) => setCourtCount(Number(e.target.value))}
              className="w-full rounded-xl border border-off-white/15 bg-charcoal px-3.5 py-2.5 text-sm text-off-white focus:border-court-green focus:outline-none"
            >
              <option value={2}>2 Courts (Small Hall)</option>
              <option value={4}>4 Courts (Standard Championship Arena)</option>
              <option value={6}>6 Courts (State Ranking Stadium)</option>
              <option value={8}>8 Courts (National Convention Centre)</option>
            </select>
            <p className="mt-1.5 text-[11px] text-muted">
              Controls the number of live mats displayed on the Stadium Radar and Video Wall
            </p>
          </div>

          {/* Demo Feed Toggle */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-off-white mb-2">
              Feed Mode
            </label>
            <div className="flex items-center justify-between rounded-xl border border-off-white/15 bg-charcoal p-3">
              <div>
                <p className="font-display text-xs font-bold uppercase text-off-white">
                  {demoFeed ? "Simulated Demo Feed" : "Live Real-Time Umpire Feed"}
                </p>
                <p className="text-[11px] text-muted">
                  {demoFeed ? "Simulates ongoing matches for previews" : "Only accepts live umpire console inputs"}
                </p>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={demoFeed}
                onClick={() => setDemoFeed(!demoFeed)}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors ${
                  demoFeed ? "bg-court-green" : "bg-off-white/20"
                }`}
              >
                <span
                  className={`pointer-events-none inline-block size-5 transform rounded-full bg-black shadow transition ${
                    demoFeed ? "translate-x-5" : "translate-x-0 bg-off-white"
                  }`}
                />
              </button>
            </div>
          </div>
        </div>

        {/* Public Announcement Ticker */}
        <div className="pt-2">
          <label className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-off-white mb-2">
            <Megaphone className="size-3.5 text-amber-400" />
            <span>Public Arena Announcement Marquee</span>
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={announcementText}
              onChange={(e) => setAnnouncementText(e.target.value)}
              placeholder="e.g. Court 3: Match called for Men's Singles Semi-Final"
              className="flex-1 rounded-xl border border-off-white/15 bg-charcoal px-3.5 py-2.5 text-sm text-off-white focus:border-court-green focus:outline-none"
            />
            {announcementText && (
              <button
                type="button"
                onClick={() => setAnnouncementText("")}
                className="rounded-xl border border-off-white/15 px-3 py-2 text-xs text-muted hover:text-off-white"
              >
                Clear
              </button>
            )}
          </div>
          <p className="mt-1 text-[11px] text-muted">
            Appears prominently on the live dashboard banner for spectators and players
          </p>
        </div>
      </div>

      {/* Feature Flags Switches Matrix */}
      <div className="rounded-2xl border border-off-white/10 bg-black/40 p-6 space-y-5">
        <div className="border-b border-off-white/10 pb-3">
          <h2 className="font-display text-sm font-bold uppercase tracking-wider text-court-green">
            2. Modular Feature Toggles (Turn ON / Turn OFF)
          </h2>
          <p className="text-xs text-muted">
            Toggle any section or engine in real-time across the application
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          {/* Programs */}
          <div className="flex items-center justify-between rounded-xl border border-off-white/10 bg-charcoal/80 p-3.5">
            <div className="flex items-center gap-3 pr-2">
              <Users className="size-4 text-court-green" />
              <div>
                <p className="font-display text-xs font-bold uppercase text-off-white">Coaching Programs & Trial</p>
                <p className="text-[11px] text-muted">WhatsApp assessment drawer & programs explorer</p>
              </div>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={settings.features.programs}
              onClick={() => toggleFeature("programs")}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors ${
                settings.features.programs ? "bg-court-green" : "bg-off-white/20"
              }`}
            >
              <span
                className={`pointer-events-none inline-block size-5 transform rounded-full bg-black shadow transition ${
                  settings.features.programs ? "translate-x-5" : "translate-x-0 bg-off-white"
                }`}
              />
            </button>
          </div>

          {/* Coach Profile */}
          <div className="flex items-center justify-between rounded-xl border border-off-white/10 bg-charcoal/80 p-3.5">
            <div className="flex items-center gap-3 pr-2">
              <Users className="size-4 text-court-green" />
              <div>
                <p className="font-display text-xs font-bold uppercase text-off-white">Coach Profile</p>
                <p className="text-[11px] text-muted">Hensiya profile, milestones, and philosophy</p>
              </div>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={settings.features.coachProfile}
              onClick={() => toggleFeature("coachProfile")}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors ${
                settings.features.coachProfile ? "bg-court-green" : "bg-off-white/20"
              }`}
            >
              <span
                className={`pointer-events-none inline-block size-5 transform rounded-full bg-black shadow transition ${
                  settings.features.coachProfile ? "translate-x-5" : "translate-x-0 bg-off-white"
                }`}
              />
            </button>
          </div>

          {/* Stadium Cheer Bar */}
          <div className="flex items-center justify-between rounded-xl border border-off-white/10 bg-charcoal/80 p-3.5">
            <div className="flex items-center gap-3 pr-2">
              <Sparkles className="size-4 text-court-green" />
              <div>
                <p className="font-display text-xs font-bold uppercase text-off-white">Spectator Cheer Bar</p>
                <p className="text-[11px] text-muted">Floating emoji reactions on live scoreboard</p>
              </div>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={settings.features.stadiumCheerBar}
              onClick={() => toggleFeature("stadiumCheerBar")}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors ${
                settings.features.stadiumCheerBar ? "bg-court-green" : "bg-off-white/20"
              }`}
            >
              <span
                className={`pointer-events-none inline-block size-5 transform rounded-full bg-black shadow transition ${
                  settings.features.stadiumCheerBar ? "translate-x-5" : "translate-x-0 bg-off-white"
                }`}
              />
            </button>
          </div>

          {/* Momentum Waveform */}
          <div className="flex items-center justify-between rounded-xl border border-off-white/10 bg-charcoal/80 p-3.5">
            <div className="flex items-center gap-3 pr-2">
              <Activity className="size-4 text-court-green" />
              <div>
                <p className="font-display text-xs font-bold uppercase text-off-white">BWF Momentum Waveform</p>
                <p className="text-[11px] text-muted">Point differential graph & telemetry</p>
              </div>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={settings.features.momentumWaveform}
              onClick={() => toggleFeature("momentumWaveform")}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors ${
                settings.features.momentumWaveform ? "bg-court-green" : "bg-off-white/20"
              }`}
            >
              <span
                className={`pointer-events-none inline-block size-5 transform rounded-full bg-black shadow transition ${
                  settings.features.momentumWaveform ? "translate-x-5" : "translate-x-0 bg-off-white"
                }`}
              />
            </button>
          </div>

          {/* Arena Radar Floorplan */}
          <div className="flex items-center justify-between rounded-xl border border-off-white/10 bg-charcoal/80 p-3.5">
            <div className="flex items-center gap-3 pr-2">
              <Compass className="size-4 text-court-green" />
              <div>
                <p className="font-display text-xs font-bold uppercase text-off-white">Arena Radar Floorplan</p>
                <p className="text-[11px] text-muted">2D top-down isometric court map</p>
              </div>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={settings.features.arenaRadarFloorplan}
              onClick={() => toggleFeature("arenaRadarFloorplan")}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors ${
                settings.features.arenaRadarFloorplan ? "bg-court-green" : "bg-off-white/20"
              }`}
            >
              <span
                className={`pointer-events-none inline-block size-5 transform rounded-full bg-black shadow transition ${
                  settings.features.arenaRadarFloorplan ? "translate-x-5" : "translate-x-0 bg-off-white"
                }`}
              />
            </button>
          </div>

          {/* Mobile Bottom Dock */}
          <div className="flex items-center justify-between rounded-xl border border-off-white/10 bg-charcoal/80 p-3.5">
            <div className="flex items-center gap-3 pr-2">
              <Radio className="size-4 text-court-green" />
              <div>
                <p className="font-display text-xs font-bold uppercase text-off-white">Mobile Bottom Dock</p>
                <p className="text-[11px] text-muted">Floating navigation bar on mobile screens</p>
              </div>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={settings.features.mobileBottomNav}
              onClick={() => toggleFeature("mobileBottomNav")}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors ${
                settings.features.mobileBottomNav ? "bg-court-green" : "bg-off-white/20"
              }`}
            >
              <span
                className={`pointer-events-none inline-block size-5 transform rounded-full bg-black shadow transition ${
                  settings.features.mobileBottomNav ? "translate-x-5" : "translate-x-0 bg-off-white"
                }`}
              />
            </button>
          </div>
        </div>
      </div>

      {/* Official BWF Laws Status Bar */}
      <div className="flex items-center justify-between rounded-2xl border border-court-green/20 bg-court-green/5 p-4 text-xs text-muted">
        <div className="flex items-center gap-2">
          <ShieldCheck className="size-4 text-court-green" />
          <span className="font-display font-bold uppercase text-off-white">
            BWF Laws of Badminton Active
          </span>
        </div>
        <span>Rally Point System (21 Pts, 30 Cap, 2-Pt Lead)</span>
      </div>
    </div>
  );
}
