"use client";

import { useState } from "react";
import {
  Sliders,
  ShieldCheck,
  Check,
  Radio,
  Sparkles,
  Activity,
  Users,
  Compass,
  Megaphone,
  Save,
  ArrowUp,
  ArrowDown,
  Plus,
  Trash2,
  RotateCcw,
} from "lucide-react";
import {
  useStudioSettings,
  DEFAULT_NAV_ITEMS,
  type NavigationItem,
} from "@/lib/settings";

export default function AdminSettingsPage() {
  const {
    settings,
    toggleFeature,
    updateNavigationItems,
    updateCta,
  } = useStudioSettings();
  const [saved, setSaved] = useState(false);
  const [announcementText, setAnnouncementText] = useState("Official Welcome: Centre Court matches streamed live in 4K. Semi-finals begin at 2:00 PM.");
  const [courtCount, setCourtCount] = useState(4);
  const [demoFeed, setDemoFeed] = useState(true);

  // New navigation link state
  const [newLinkLabel, setNewLinkLabel] = useState("");
  const [newLinkHref, setNewLinkHref] = useState("");
  const [newLinkError, setNewLinkError] = useState<string | null>(null);

  const handleToggleNavItem = (id: string) => {
    const updated = settings.navigationItems.map((item) =>
      item.id === id ? { ...item, enabled: !item.enabled } : item
    );
    updateNavigationItems(updated);
  };

  const handleUpdateNavItemLabel = (id: string, label: string) => {
    const updated = settings.navigationItems.map((item) =>
      item.id === id ? { ...item, label } : item
    );
    updateNavigationItems(updated);
  };

  const handleUpdateNavItemHref = (id: string, href: string) => {
    const updated = settings.navigationItems.map((item) =>
      item.id === id ? { ...item, href } : item
    );
    updateNavigationItems(updated);
  };

  const handleMoveNavItem = (index: number, direction: "up" | "down") => {
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= settings.navigationItems.length) return;
    const items = [...settings.navigationItems];
    const [moved] = items.splice(index, 1);
    items.splice(targetIndex, 0, moved);
    updateNavigationItems(items);
  };

  const handleDeleteNavItem = (id: string) => {
    if (settings.navigationItems.length <= 1) return;
    const updated = settings.navigationItems.filter((item) => item.id !== id);
    updateNavigationItems(updated);
  };

  const handleAddNavItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLinkLabel.trim() || !newLinkHref.trim()) {
      setNewLinkError("Please provide both label and URL.");
      return;
    }
    const newItem: NavigationItem = {
      id: `custom-${Date.now()}`,
      label: newLinkLabel.trim(),
      href: newLinkHref.trim(),
      enabled: true,
    };
    updateNavigationItems([...settings.navigationItems, newItem]);
    setNewLinkLabel("");
    setNewLinkHref("");
    setNewLinkError(null);
  };

  const handleResetNav = () => {
    updateNavigationItems(DEFAULT_NAV_ITEMS);
    updateCta({ label: "Register", href: "/#tournaments", enabled: true });
  };

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

      {/* Navigation Bar & Public Header Customizer */}
      <div className="rounded-2xl border border-off-white/10 bg-black/40 p-6 space-y-6">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between border-b border-off-white/10 pb-4">
          <div>
            <h2 className="font-display text-sm font-bold uppercase tracking-wider text-court-green">
              3. Navigation Bar & Header Customizer
            </h2>
            <p className="text-xs text-muted">
              Customize links in the top navigation bar and mobile drawer. Turn links ON/OFF, edit labels & URLs, reorder, or add new links.
            </p>
          </div>

          <button
            type="button"
            onClick={handleResetNav}
            className="flex items-center gap-1.5 rounded-lg border border-off-white/15 bg-charcoal px-3 py-1.5 text-xs text-muted hover:border-court-green/40 hover:text-off-white transition-all self-start sm:self-auto"
          >
            <RotateCcw className="size-3.5 text-court-green" />
            <span>Reset Defaults</span>
          </button>
        </div>

        {/* Live Header Preview */}
        <div className="space-y-2">
          <label className="block text-xs font-bold uppercase tracking-wider text-off-white">
            Live Header Preview (Spectator View)
          </label>
          <div className="rounded-xl border border-off-white/15 bg-charcoal/90 p-4 shadow-inner">
            <div className="flex flex-wrap items-center justify-between gap-4">
              {/* Brand Logo Preview */}
              <div className="flex items-center gap-2 font-display text-xs font-black tracking-widest uppercase text-off-white">
                <span>Hensiya</span>
                <span className="relative flex size-2 items-center justify-center">
                  <span className="absolute inline-flex size-full animate-ping rounded-full bg-court-green opacity-75" />
                  <span className="relative inline-flex size-1.5 rounded-full bg-court-green" />
                </span>
              </div>

              {/* Active Links Preview */}
              <div className="flex flex-wrap items-center gap-3 sm:gap-6">
                {settings.navigationItems.filter((i) => i.enabled).map((item) => (
                  <span
                    key={item.id}
                    className="font-display text-[11px] font-bold uppercase tracking-wider text-off-white hover:text-court-green transition-colors"
                  >
                    {item.label}
                  </span>
                ))}
              </div>

              {/* CTA Preview */}
              {settings.ctaEnabled && (
                <span className="rounded-lg border border-court-green/60 bg-court-green/10 px-3 py-1 font-display text-[10px] font-bold uppercase tracking-wider text-court-green">
                  {settings.ctaLabel || "Register"}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Primary CTA Button Settings */}
        <div className="rounded-xl border border-off-white/10 bg-charcoal/60 p-4 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-display text-xs font-bold uppercase text-off-white">
                Primary Header CTA Button
              </p>
              <p className="text-[11px] text-muted">
                Highlights the main action button on the top right of the navigation bar
              </p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={settings.ctaEnabled}
              onClick={() => updateCta({ enabled: !settings.ctaEnabled })}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors ${
                settings.ctaEnabled ? "bg-court-green" : "bg-off-white/20"
              }`}
            >
              <span
                className={`pointer-events-none inline-block size-5 transform rounded-full bg-black shadow transition ${
                  settings.ctaEnabled ? "translate-x-5" : "translate-x-0 bg-off-white"
                }`}
              />
            </button>
          </div>

          {settings.ctaEnabled && (
            <div className="grid gap-4 sm:grid-cols-2 pt-2 border-t border-off-white/10">
              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-wider text-muted mb-1.5">
                  CTA Button Label
                </label>
                <input
                  type="text"
                  value={settings.ctaLabel}
                  onChange={(e) => updateCta({ label: e.target.value })}
                  placeholder="e.g. Register"
                  className="w-full rounded-xl border border-off-white/15 bg-charcoal px-3 py-2 text-xs text-off-white focus:border-court-green focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-wider text-muted mb-1.5">
                  CTA Target URL / Anchor
                </label>
                <input
                  type="text"
                  value={settings.ctaHref}
                  onChange={(e) => updateCta({ href: e.target.value })}
                  placeholder="e.g. /#tournaments"
                  className="w-full rounded-xl border border-off-white/15 bg-charcoal px-3 py-2 text-xs text-off-white focus:border-court-green focus:outline-none"
                />
              </div>
            </div>
          )}
        </div>

        {/* Navigation Links Table */}
        <div className="space-y-3">
          <label className="block text-xs font-bold uppercase tracking-wider text-off-white">
            Navigation Links Hierarchy ({settings.navigationItems.length} Links)
          </label>

          <div className="space-y-2">
            {settings.navigationItems.map((item, index) => (
              <div
                key={item.id}
                className={`flex flex-col gap-3 rounded-xl border p-3 sm:flex-row sm:items-center sm:justify-between transition-colors ${
                  item.enabled
                    ? "border-off-white/15 bg-charcoal/80"
                    : "border-off-white/5 bg-charcoal/30 opacity-60"
                }`}
              >
                {/* Reorder and State */}
                <div className="flex items-center gap-2">
                  <div className="flex flex-col gap-0.5">
                    <button
                      type="button"
                      disabled={index === 0}
                      onClick={() => handleMoveNavItem(index, "up")}
                      aria-label="Move item up"
                      className="rounded p-1 text-muted hover:bg-white/10 hover:text-off-white disabled:opacity-20"
                    >
                      <ArrowUp className="size-3" />
                    </button>
                    <button
                      type="button"
                      disabled={index === settings.navigationItems.length - 1}
                      onClick={() => handleMoveNavItem(index, "down")}
                      aria-label="Move item down"
                      className="rounded p-1 text-muted hover:bg-white/10 hover:text-off-white disabled:opacity-20"
                    >
                      <ArrowDown className="size-3" />
                    </button>
                  </div>

                  <span className="font-mono text-xs text-muted w-5 text-center">
                    {index + 1}
                  </span>

                  <button
                    type="button"
                    role="switch"
                    aria-checked={item.enabled}
                    onClick={() => handleToggleNavItem(item.id)}
                    className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors ${
                      item.enabled ? "bg-court-green" : "bg-off-white/20"
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block size-4 transform rounded-full bg-black shadow transition ${
                        item.enabled ? "translate-x-4" : "translate-x-0 bg-off-white"
                      }`}
                    />
                  </button>

                  <span
                    className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${
                      item.enabled
                        ? "bg-court-green/15 text-court-green border border-court-green/30"
                        : "bg-white/5 text-muted border border-white/10"
                    }`}
                  >
                    {item.enabled ? "Visible" : "Hidden"}
                  </span>
                </div>

                {/* Editable Inputs */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 flex-1 sm:mx-3">
                  <input
                    type="text"
                    value={item.label}
                    onChange={(e) => handleUpdateNavItemLabel(item.id, e.target.value)}
                    placeholder="Link Label"
                    className="rounded-lg border border-off-white/15 bg-black/40 px-3 py-1.5 text-xs text-off-white focus:border-court-green focus:outline-none"
                  />
                  <input
                    type="text"
                    value={item.href}
                    onChange={(e) => handleUpdateNavItemHref(item.id, e.target.value)}
                    placeholder="URL (e.g. /#tournaments)"
                    className="rounded-lg border border-off-white/15 bg-black/40 px-3 py-1.5 text-xs text-off-white font-mono focus:border-court-green focus:outline-none"
                  />
                </div>

                {/* Delete Action */}
                <button
                  type="button"
                  onClick={() => handleDeleteNavItem(item.id)}
                  disabled={settings.navigationItems.length <= 1}
                  title="Delete Navigation Link"
                  className="self-end sm:self-auto rounded-lg p-2 text-muted hover:bg-red-500/10 hover:text-red-400 disabled:opacity-20 transition-colors"
                >
                  <Trash2 className="size-4" />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Add New Link Inline Form */}
        <form onSubmit={handleAddNavItem} className="rounded-xl border border-dashed border-off-white/20 bg-charcoal/40 p-4 space-y-3">
          <p className="font-display text-xs font-bold uppercase text-off-white">
            Add New Navigation Link
          </p>

          <div className="grid gap-3 sm:grid-cols-[1fr_1fr_auto]">
            <input
              type="text"
              value={newLinkLabel}
              onChange={(e) => setNewLinkLabel(e.target.value)}
              placeholder="Label (e.g. Draws & Brackets)"
              className="rounded-xl border border-off-white/15 bg-charcoal px-3 py-2 text-xs text-off-white focus:border-court-green focus:outline-none"
            />
            <input
              type="text"
              value={newLinkHref}
              onChange={(e) => setNewLinkHref(e.target.value)}
              placeholder="Path (e.g. /#tournaments or /live)"
              className="rounded-xl border border-off-white/15 bg-charcoal px-3 py-2 text-xs text-off-white font-mono focus:border-court-green focus:outline-none"
            />
            <button
              type="submit"
              className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-court-green/15 border border-court-green/40 px-4 py-2 font-display text-xs font-bold uppercase text-court-green hover:bg-court-green hover:text-black transition-all"
            >
              <Plus className="size-3.5" />
              <span>Add Link</span>
            </button>
          </div>

          {newLinkError && (
            <p className="text-xs text-red-400 font-semibold">{newLinkError}</p>
          )}
        </form>
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
