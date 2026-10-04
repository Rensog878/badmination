"use client";

import { useEffect, useState } from "react";
import { Wifi, WifiOff } from "lucide-react";

export default function PwaProvider({ children }: { children: React.ReactNode }) {
  const [isOffline, setIsOffline] = useState(false);
  const [justReconnected, setJustReconnected] = useState(false);

  useEffect(() => {
    // 1. Service Worker Registration
    if (typeof window !== "undefined" && "serviceWorker" in navigator) {
      window.addEventListener("load", () => {
        navigator.serviceWorker
          .register("/sw.js")
          .then((reg) => {
            // Check for service worker updates periodically
            reg.onupdatefound = () => {
              const installingWorker = reg.installing;
              if (installingWorker) {
                installingWorker.onstatechange = () => {
                  if (installingWorker.state === "installed" && navigator.serviceWorker.controller) {
                    // New content is available
                  }
                };
              }
            };
          })
          .catch((err) => {
            console.error("PWA Service Worker registration failed:", err);
          });
      });
    }

    // 2. Network connectivity listeners
    const handleOnline = () => {
      setIsOffline(false);
      setJustReconnected(true);
      const timer = setTimeout(() => setJustReconnected(false), 3500);
      return () => clearTimeout(timer);
    };

    const handleOffline = () => {
      setIsOffline(true);
      setJustReconnected(false);
    };

    if (typeof window !== "undefined") {
      setIsOffline(!navigator.onLine);
      window.addEventListener("online", handleOnline);
      window.addEventListener("offline", handleOffline);
    }

    return () => {
      if (typeof window !== "undefined") {
        window.removeEventListener("online", handleOnline);
        window.removeEventListener("offline", handleOffline);
      }
    };
  }, []);

  return (
    <>
      {children}

      {/* Offline Stadium Notice Pill */}
      {isOffline && (
        <div
          role="status"
          aria-live="polite"
          className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2.5 rounded-full border border-amber-500/50 bg-charcoal/95 px-4 py-2 font-display text-xs font-bold text-amber-300 uppercase shadow-2xl backdrop-blur-xl animate-fade-in"
        >
          <WifiOff className="size-3.5 text-amber-400 animate-pulse" />
          <span>Offline Stadium Mode · Showing Cached Data</span>
        </div>
      )}

      {/* Reconnected Toast */}
      {justReconnected && (
        <div
          role="status"
          aria-live="polite"
          className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2.5 rounded-full border border-court-green/50 bg-charcoal/95 px-4 py-2 font-display text-xs font-bold text-court-green uppercase shadow-2xl backdrop-blur-xl animate-fade-in"
        >
          <Wifi className="size-3.5 text-court-green" />
          <span>Connected · Match Feeds Live</span>
        </div>
      )}
    </>
  );
}
