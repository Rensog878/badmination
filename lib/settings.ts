"use client";

import { useEffect, useState, useCallback } from "react";
import { FEATURES, type FeatureFlags } from "@/lib/features";

export interface StudioSettings {
  features: FeatureFlags;
  themeMode: "midnight" | "daylight";
  soundEnabled: boolean;
  corkSound: boolean;
  hapticsEnabled: boolean;
  preferredView: "arena" | "grid" | "dual" | "quad";
}

const STORAGE_KEY = "badmination_studio_settings_v2";

export const DEFAULT_SETTINGS: StudioSettings = {
  features: { ...FEATURES },
  themeMode: "midnight",
  soundEnabled: true,
  corkSound: true,
  hapticsEnabled: true,
  preferredView: "arena",
};

export function getStoredSettings(): StudioSettings {
  if (typeof window === "undefined") return DEFAULT_SETTINGS;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_SETTINGS;
    const parsed = JSON.parse(raw) as Partial<StudioSettings>;
    return {
      ...DEFAULT_SETTINGS,
      ...parsed,
      features: {
        ...DEFAULT_SETTINGS.features,
        ...(parsed.features || {}),
      },
    };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export function saveStoredSettings(next: StudioSettings): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    window.dispatchEvent(new CustomEvent("badmination:settings-change", { detail: next }));
  } catch {
    // ignore quota errors
  }
}

/** Hook that syncs state across components and storage */
export function useStudioSettings() {
  const [settings, setSettings] = useState<StudioSettings>(DEFAULT_SETTINGS);

  useEffect(() => {
    setSettings(getStoredSettings());

    const handleSettingsChange = (e: Event) => {
      const customEvent = e as CustomEvent<StudioSettings>;
      if (customEvent.detail) {
        setSettings(customEvent.detail);
      } else {
        setSettings(getStoredSettings());
      }
    };

    window.addEventListener("badmination:settings-change", handleSettingsChange);
    return () => window.removeEventListener("badmination:settings-change", handleSettingsChange);
  }, []);

  const toggleFeature = useCallback((key: keyof FeatureFlags) => {
    setSettings((prev) => {
      const updated: StudioSettings = {
        ...prev,
        features: {
          ...prev.features,
          [key]: !prev.features[key],
        },
      };
      saveStoredSettings(updated);
      return updated;
    });
  }, []);

  const updateSetting = useCallback(<K extends keyof StudioSettings>(key: K, value: StudioSettings[K]) => {
    setSettings((prev) => {
      const updated: StudioSettings = {
        ...prev,
        [key]: value,
      };
      saveStoredSettings(updated);
      return updated;
    });
  }, []);

  const resetDefaults = useCallback(() => {
    setSettings(DEFAULT_SETTINGS);
    saveStoredSettings(DEFAULT_SETTINGS);
  }, []);

  return {
    settings,
    toggleFeature,
    updateSetting,
    resetDefaults,
  };
}
