"use client";

import { useEffect, useState } from "react";
import {
  X,
  Sliders,
  Sparkles,
  Volume2,
  Vibrate,
  Radio,
  Activity,
  Hand,
  RotateCcw,
  Check,
  LayoutGrid,
  Users,
  Compass,
} from "lucide-react";
import { useStudioSettings } from "@/lib/settings";

interface StudioSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function StudioSettingsModal({ isOpen, onClose }: StudioSettingsModalProps) {
  const { settings, toggleFeature, updateSetting, resetDefaults } = useStudioSettings();
  const [justReset, setJustReset] = useState(false);

  // Esc key and background lock
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleReset = () => {
    resetDefaults();
    setJustReset(true);
    setTimeout(() => setJustReset(false), 2000);
  };

  const featureGroups = [
    {
      title: "Atmosphere & Soundscape",
      desc: "Acoustic cork sound effects and haptic vibration feedback",
      items: [
        {
          id: "soundEffects",
          label: "Audio Sound Effects",
          desc: "Authentic Yonex feather shuttlecock strike chimes and umpire bells",
          icon: Volume2,
          active: settings.features.soundEffects,
          toggle: () => toggleFeature("soundEffects"),
        },
        {
          id: "haptics",
          label: "Tactile Haptic Feedback",
          desc: "Vibration pulses on score ticks, victory alerts, and button taps",
          icon: Vibrate,
          active: settings.hapticsEnabled,
          toggle: () => updateSetting("hapticsEnabled", !settings.hapticsEnabled),
        },
        {
          id: "cheers",
          label: "Spectator Cheer Engine",
          desc: "Floating smash, fire rally, and bravo emoji reactions",
          icon: Sparkles,
          active: settings.features.stadiumCheerBar,
          toggle: () => toggleFeature("stadiumCheerBar"),
        },
      ],
    },
    {
      title: "Match & Broadcast Controls",
      desc: "Live telemetry, tournament layouts, and video walls",
      items: [
        {
          id: "arenaRadar",
          label: "Arena Radar Floorplan",
          desc: "Top-down 2D BWF court map with server positions & pulse radar",
          icon: Compass,
          active: settings.features.arenaRadarFloorplan,
          toggle: () => toggleFeature("arenaRadarFloorplan"),
        },
        {
          id: "momentum",
          label: "BWF Momentum Waveform",
          desc: "Real-time point differential area chart and rally flow tracking",
          icon: Activity,
          active: settings.features.momentumWaveform,
          toggle: () => toggleFeature("momentumWaveform"),
        },
        {
          id: "multiCourt",
          label: "Multi-Court Video Wall",
          desc: "Split-screen broadcast view (Dual or Quad courts simultaneously)",
          icon: LayoutGrid,
          active: settings.features.multiCourtBroadcast,
          toggle: () => toggleFeature("multiCourtBroadcast"),
        },
      ],
    },
    {
      title: "Mobile & Umpire Ergonomics",
      desc: "Navigation and court-side referee tools",
      items: [
        {
          id: "mobileDock",
          label: "Mobile Bottom App Dock",
          desc: "Floating thumb-friendly navigation bar on mobile phones",
          icon: Radio,
          active: settings.features.mobileBottomNav,
          toggle: () => toggleFeature("mobileBottomNav"),
        },
        {
          id: "thumbMode",
          label: "Single-Hand Umpire Pad",
          desc: "Ergonomic thumb sweep arc for court-side scorekeeping",
          icon: Hand,
          active: settings.features.singleHandThumbMode,
          toggle: () => toggleFeature("singleHandThumbMode"),
        },
      ],
    },
    {
      title: "Academy & Content Sections",
      desc: "Public coaching programs, coach profile, and media showcase",
      items: [
        {
          id: "programs",
          label: "Coaching Programs & Trial Booking",
          desc: "Training tracks, skill levels, and interactive WhatsApp booking drawer",
          icon: Users,
          active: settings.features.programs,
          toggle: () => toggleFeature("programs"),
        },
        {
          id: "coachProfile",
          label: "Meet the Coach Profile",
          desc: "Coach Hensiya's career milestones, pillars, and coaching philosophy",
          icon: Users,
          active: settings.features.coachProfile,
          toggle: () => toggleFeature("coachProfile"),
        },
      ],
    },
  ];

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="studio-settings-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/80 backdrop-blur-md animate-fade-in"
    >
      {/* Click outside backdrop to close */}
      <div className="absolute inset-0" onClick={onClose} />

      {/* Modal Card */}
      <div className="relative z-10 flex flex-col w-full max-w-2xl max-h-[90vh] rounded-3xl border border-off-white/15 bg-charcoal shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-off-white/10 px-6 py-5 bg-black/40">
          <div className="flex items-center gap-3">
            <span className="flex size-9 items-center justify-center rounded-xl bg-court-green/15 text-court-green border border-court-green/30">
              <Sliders className="size-4" />
            </span>
            <div>
              <h2 id="studio-settings-title" className="font-display text-base font-black tracking-wider uppercase text-off-white">
                Arena Controls & Feature Flags
              </h2>
              <p className="text-xs text-muted">
                Customize live broadcast, atmosphere, and navigation options
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex size-9 items-center justify-center rounded-xl border border-off-white/10 bg-off-white/5 text-muted hover:text-off-white transition-colors"
          >
            <X className="size-5" />
            <span className="sr-only">Close settings</span>
          </button>
        </div>

        {/* Modal Body - Scrollable Settings Groups */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {featureGroups.map((group) => (
            <div key={group.title} className="space-y-3">
              <div className="border-b border-off-white/10 pb-2">
                <h3 className="font-display text-xs font-bold uppercase tracking-wider text-court-green">
                  {group.title}
                </h3>
                <p className="text-[11px] text-muted">{group.desc}</p>
              </div>

              <div className="space-y-2">
                {group.items.map((item) => {
                  const Icon = item.icon;
                  return (
                    <div
                      key={item.id}
                      className="flex items-center justify-between rounded-xl border border-off-white/10 bg-black/30 p-3.5 transition-colors hover:border-off-white/20"
                    >
                      <div className="flex items-center gap-3 pr-4">
                        <span
                          className={`flex size-8 shrink-0 items-center justify-center rounded-lg ${
                            item.active ? "bg-court-green/20 text-court-green" : "bg-off-white/5 text-muted"
                          }`}
                        >
                          <Icon className="size-4" />
                        </span>
                        <div>
                          <p className="font-display text-xs font-bold uppercase text-off-white">
                            {item.label}
                          </p>
                          <p className="text-[11px] text-muted leading-tight mt-0.5">{item.desc}</p>
                        </div>
                      </div>

                      {/* Toggle Switch */}
                      <button
                        type="button"
                        role="switch"
                        aria-checked={item.active}
                        onClick={item.toggle}
                        className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                          item.active ? "bg-court-green shadow-[0_0_12px_rgba(16,185,129,0.5)]" : "bg-off-white/20"
                        }`}
                      >
                        <span
                          className={`pointer-events-none inline-block size-5 transform rounded-full bg-black shadow-md ring-0 transition duration-200 ease-in-out ${
                            item.active ? "translate-x-5 bg-black" : "translate-x-0 bg-off-white"
                          }`}
                        />
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between border-t border-off-white/10 bg-black/40 px-6 py-4">
          <button
            type="button"
            onClick={handleReset}
            className="flex items-center gap-1.5 text-xs text-muted hover:text-off-white transition-colors"
          >
            {justReset ? (
              <>
                <Check className="size-3.5 text-court-green" />
                <span className="text-court-green font-bold">Reset to Defaults</span>
              </>
            ) : (
              <>
                <RotateCcw className="size-3.5" />
                <span>Reset to Defaults</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={onClose}
            className="rounded-xl bg-court-green px-5 py-2 font-display text-xs font-bold uppercase tracking-wider text-black hover:bg-off-white transition-colors shadow-md"
          >
            Apply & Close
          </button>
        </div>
      </div>
    </div>
  );
}
