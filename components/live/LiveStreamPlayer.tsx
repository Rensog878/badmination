"use client";

import { useState } from "react";
import {
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Radio,
  Tv,
  Volume2,
} from "lucide-react";
import { parseVideoUrl } from "@/lib/media/video";
import type { LiveMatch } from "@/lib/live/types";

interface LiveStreamPlayerProps {
  streamUrl: string;
  court?: number | null;
  event?: string;
  round?: string;
  status?: LiveMatch["status"];
  sides?: LiveMatch["sides"];
  compact?: boolean;
}

export default function LiveStreamPlayer({
  streamUrl,
  court,
  event,
  round,
  status = "live",
  sides,
  compact = false,
}: LiveStreamPlayerProps) {
  const [collapsed, setCollapsed] = useState(compact);
  const parsed = parseVideoUrl(streamUrl);

  if (!parsed) return null;

  const isLive = status === "live";
  const isFinished = status === "finished";

  const matchTitle = sides
    ? `${sides.a.join(" / ")} vs ${sides.b.join(" / ")}`
    : event && round
    ? `${event} · ${round}`
    : "Court Video";

  if (collapsed) {
    return (
      <div className="flex items-center justify-between rounded-xl border border-white/10 bg-black/70 px-4 py-2.5 backdrop-blur-md">
        <div className="flex items-center gap-2.5">
          <span
            className={`size-2 rounded-full ${
              isLive ? "bg-red-500 animate-pulse shadow-[0_0_8px_rgba(239,68,68,0.8)]" : "bg-court-green"
            }`}
          />
          <Tv className="size-4 text-court-green" />
          <span className="font-display text-xs font-bold tracking-[0.14em] uppercase text-off-white">
            {court ? `Court ${court} Stream` : "Match Video"}
          </span>
          <span className="hidden text-xs text-muted sm:inline truncate max-w-xs">
            {matchTitle}
          </span>
        </div>
        <button
          type="button"
          onClick={() => setCollapsed(false)}
          className="inline-flex items-center gap-1.5 rounded-lg border border-white/15 px-3 py-1 text-xs font-semibold text-off-white hover:border-court-green hover:text-court-green transition-colors"
        >
          <span>Expand Video</span>
          <ChevronDown className="size-3.5" />
        </button>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-white/15 bg-black shadow-[0_12px_40px_rgba(0,0,0,0.8)] transition-all">
      {/* Player Header Bar */}
      <div className="flex items-center justify-between gap-3 border-b border-white/10 bg-white/[0.04] px-4 py-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <div
            className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 font-display text-[10px] font-bold tracking-[0.14em] uppercase ${
              isLive
                ? "bg-red-600/30 text-red-400 border border-red-500/40"
                : isFinished
                ? "bg-amber-400/20 text-amber-300 border border-amber-400/30"
                : "bg-court-green/20 text-court-green border border-court-green/30"
            }`}
          >
            {isLive ? (
              <>
                <span className="size-1.5 rounded-full bg-red-400 animate-pulse" />
                <span>Live Broadcast</span>
              </>
            ) : isFinished ? (
              <>
                <Radio className="size-3" />
                <span>Match Replay</span>
              </>
            ) : (
              <>
                <Tv className="size-3" />
                <span>Feed Ready</span>
              </>
            )}
          </div>

          <span className="font-display text-xs font-bold uppercase tracking-[0.14em] text-off-white shrink-0">
            {court ? `Court ${court}` : ""}
          </span>
          <span className="truncate text-xs text-muted hidden sm:inline">
            {matchTitle}
          </span>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <a
            href={parsed.originalUrl}
            target="_blank"
            rel="noopener noreferrer"
            title="Watch in external player"
            className="inline-flex size-8 items-center justify-center rounded-lg border border-white/10 text-muted hover:border-court-green hover:text-court-green transition-colors"
          >
            <ExternalLink className="size-3.5" />
          </a>
          <button
            type="button"
            onClick={() => setCollapsed(true)}
            aria-label="Minimize video player"
            className="inline-flex size-8 items-center justify-center rounded-lg border border-white/10 text-muted hover:border-court-green hover:text-court-green transition-colors"
          >
            <ChevronUp className="size-4" />
          </button>
        </div>
      </div>

      {/* Video Viewport Container (16:9 Cinema Aspect Ratio) */}
      <div className="relative aspect-video w-full bg-black">
        {parsed.provider === "direct" ? (
          <video
            src={parsed.embedUrl}
            controls
            playsInline
            autoPlay
            muted
            className="size-full object-contain"
          />
        ) : (
          <iframe
            src={parsed.embedUrl}
            title={matchTitle}
            className="size-full border-0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
          />
        )}
      </div>

      {/* Hint Footer Bar */}
      <div className="flex items-center justify-between gap-3 border-t border-white/10 bg-white/[0.02] px-4 py-2 text-[11px] text-muted">
        <span className="flex items-center gap-1.5">
          <Volume2 className="size-3.5 text-court-green shrink-0" />
          <span>Autoplays muted by browser policy. Tap unmute on player controls for arena audio.</span>
        </span>
        <span className="font-display font-semibold uppercase tracking-[0.12em] opacity-80 shrink-0">
          {parsed.provider === "youtube"
            ? "YouTube Stream"
            : parsed.provider === "twitch"
            ? "Twitch Broadcast"
            : parsed.provider === "vimeo"
            ? "Vimeo Feed"
            : "Video Feed"}
        </span>
      </div>
    </div>
  );
}
