"use client";

import { RefreshCw } from "lucide-react";

export default function ReconnectButton() {
  return (
    <button
      type="button"
      onClick={() => {
        if (typeof window !== "undefined") window.location.reload();
      }}
      className="btn-shimmer inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-court-green px-6 py-3 font-display text-xs font-bold tracking-[0.16em] uppercase text-black hover:bg-off-white transition-all shadow-lg shadow-court-green/20"
    >
      <RefreshCw className="size-4" />
      <span>Try Reconnecting</span>
    </button>
  );
}
