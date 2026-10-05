"use client";

import { useEffect, useState, useCallback } from "react";
import { FEATURES, type FeatureFlags } from "@/lib/features";

export interface NavigationItem {
  id: string;
  label: string;
  href: string;
  enabled: boolean;
}

export interface StudioSettings {
  features: FeatureFlags;
  themeMode: "midnight" | "daylight";
  soundEnabled: boolean;
  corkSound: boolean;
  hapticsEnabled: boolean;
  preferredView: "arena" | "grid" | "dual" | "quad";
  navigationItems: NavigationItem[];
  ctaLabel: string;
  ctaHref: string;
  ctaEnabled: boolean;
}

const STORAGE_KEY = "badmination_studio_settings_v2";

export const DEFAULT_NAV_ITEMS: NavigationItem[] = [
  { id: "home", label: "Home", href: "/", enabled: true },
  { id: "tournaments", label: "Tournaments", href: "/#tournaments", enabled: true },
  { id: "live", label: "Live", href: "/live", enabled: true },
  { id: "umpire", label: "Umpire Console", href: "/umpire/cuddalore-open-2026", enabled: true },
];

export const DEFAULT_SETTINGS: StudioSettings = {
  features: { ...FEATURES },
  themeMode: "midnight",
  soundEnabled: true,
  corkSound: true,
  hapticsEnabled: true,
  preferredView: "arena",
  navigationItems: DEFAULT_NAV_ITEMS,
  ctaLabel: "Register",
  ctaHref: "/#tournaments",
  ctaEnabled: true,
};

export function getStoredSettings(): StudioSettings {
  if (typeof window === "undefined") return DEFAULT_SETTINGS;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_SETTINGS;
    const parsed = JSON.parse(raw) as Partial<StudioSettings>;
    const storedNav = Array.isArray(parsed.navigationItems) && parsed.navigationItems.length > 0
      ? parsed.navigationItems
      : DEFAULT_NAV_ITEMS;

    return {
      ...DEFAULT_SETTINGS,
      ...parsed,
      features: {
        ...DEFAULT_SETTINGS.features,
        ...(parsed.features || {}),
      },
      navigationItems: storedNav,
      ctaLabel: typeof parsed.ctaLabel === "string" ? parsed.ctaLabel : DEFAULT_SETTINGS.ctaLabel,
      ctaHref: typeof parsed.ctaHref === "string" ? parsed.ctaHref : DEFAULT_SETTINGS.ctaHref,
      ctaEnabled: typeof parsed.ctaEnabled === "boolean" ? parsed.ctaEnabled : DEFAULT_SETTINGS.ctaEnabled,
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

  const updateNavigationItems = useCallback((items: NavigationItem[]) => {
    setSettings((prev) => {
      const updated: StudioSettings = {
        ...prev,
        navigationItems: items,
      };
      saveStoredSettings(updated);
      return updated;
    });
  }, []);

  const updateCta = useCallback((cta: Partial<{ label: string; href: string; enabled: boolean }>) => {
    setSettings((prev) => {
      const updated: StudioSettings = {
        ...prev,
        ctaLabel: cta.label !== undefined ? cta.label : prev.ctaLabel,
        ctaHref: cta.href !== undefined ? cta.href : prev.ctaHref,
        ctaEnabled: cta.enabled !== undefined ? cta.enabled : prev.ctaEnabled,
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
    updateNavigationItems,
    updateCta,
    resetDefaults,
  };
}
