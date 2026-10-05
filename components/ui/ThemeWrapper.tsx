"use client";

import { useEffect, useState, type ReactNode } from "react";
import { useStudioSettings } from "@/lib/settings";

interface ThemeWrapperProps {
  children: ReactNode;
  defaultMode?: "midnight" | "daylight";
  className?: string;
}

export default function ThemeWrapper({
  children,
  defaultMode = "midnight",
  className = "",
}: ThemeWrapperProps) {
  const { settings } = useStudioSettings();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const activeMode = mounted ? settings.themeMode : defaultMode;
  const themeClass = activeMode === "daylight" ? "theme-light" : "theme-midnight";

  return (
    <div className={`${themeClass} ${className} transition-colors duration-300`}>
      {children}
    </div>
  );
}
