"use client";

import { useEffect, useRef, useState } from "react";
import { Download, Share2, Trophy, X, Check } from "lucide-react";
import type { LiveMatch } from "@/lib/live/types";
import { sideName } from "@/components/live/CourtCard";
import { gamesWon } from "@/lib/live/scoring";

interface MatchWinnerCardModalProps {
  match: LiveMatch;
  tournamentName: string;
  venue?: string;
  onClose: () => void;
}

export default function MatchWinnerCardModal({
  match,
  tournamentName,
  venue = "Arena Complex",
  onClose,
}: MatchWinnerCardModalProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [dataUrl, setDataUrl] = useState<string | null>(null);
  const [shared, setShared] = useState(false);

  const winnerSide = match.winner ?? (match.games[match.games.length - 1]?.a > match.games[match.games.length - 1]?.b ? "a" : "b");
  const loserSide = winnerSide === "a" ? "b" : "a";
  const winnerName = sideName(match, winnerSide);
  const loserName = sideName(match, loserSide);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Dimensions: 1080 x 1920 (9:16 Instagram Story / WhatsApp Status)
    const W = 1080;
    const H = 1920;
    canvas.width = W;
    canvas.height = H;

    // 1. Deep Midnight Gradient Background
    const bgGrad = ctx.createLinearGradient(0, 0, W, H);
    bgGrad.addColorStop(0, "#0a0d0c");
    bgGrad.addColorStop(0.5, "#101614");
    bgGrad.addColorStop(1, "#050706");
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, W, H);

    // 2. Neon Court Green Radial Glow in Center
    const glow = ctx.createRadialGradient(W / 2, H * 0.45, 50, W / 2, H * 0.45, 600);
    glow.addColorStop(0, "rgba(16, 185, 129, 0.18)");
    glow.addColorStop(0.6, "rgba(16, 185, 129, 0.04)");
    glow.addColorStop(1, "rgba(0, 0, 0, 0)");
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, W, H);

    // 3. Badminton Court Geometry Watermark in Background
    ctx.strokeStyle = "rgba(255, 255, 255, 0.05)";
    ctx.lineWidth = 4;
    // Outer court lines
    ctx.strokeRect(100, 260, W - 200, H - 520);
    // Center net line
    ctx.beginPath();
    ctx.moveTo(100, H / 2);
    ctx.lineTo(W - 100, H / 2);
    ctx.stroke();
    // Service line
    ctx.beginPath();
    ctx.moveTo(100, H / 2 - 200);
    ctx.lineTo(W - 100, H / 2 - 200);
    ctx.moveTo(100, H / 2 + 200);
    ctx.lineTo(W - 100, H / 2 + 200);
    ctx.stroke();

    // 4. Header: Platform & Event Tag
    ctx.fillStyle = "#10b981";
    ctx.font = "bold 32px 'Cabinet Grotesk', system-ui, sans-serif";
    ctx.textAlign = "center";
    ctx.letterSpacing = "6px";
    ctx.fillText("BADMINATION CHAMPIONSHIP SERIES", W / 2, 140);

    // Tournament Name
    ctx.fillStyle = "#ffffff";
    ctx.font = "900 56px 'Cabinet Grotesk', system-ui, sans-serif";
    ctx.letterSpacing = "2px";
    ctx.fillText(tournamentName.toUpperCase(), W / 2, 215);

    // Venue & Category Pill
    ctx.fillStyle = "#94a3b8";
    ctx.font = "600 28px system-ui, sans-serif";
    ctx.letterSpacing = "1px";
    ctx.fillText(`${venue.toUpperCase()} · ${match.event.toUpperCase()} · ${match.round.toUpperCase()}`, W / 2, 270);

    // 5. Crown & Trophy Badge
    ctx.beginPath();
    ctx.arc(W / 2, 460, 75, 0, Math.PI * 2);
    ctx.fillStyle = "#10b981";
    ctx.fill();

    // Trophy Icon
    ctx.fillStyle = "#000000";
    ctx.font = "bold 64px system-ui";
    ctx.fillText("🏆", W / 2, 480);

    // VICTORY Label
    ctx.fillStyle = "#10b981";
    ctx.font = "bold 36px 'Cabinet Grotesk', system-ui, sans-serif";
    ctx.letterSpacing = "8px";
    ctx.fillText("MATCH WINNER", W / 2, 590);

    // 6. WINNER NAME
    ctx.fillStyle = "#ffffff";
    ctx.font = "900 84px 'Cabinet Grotesk', system-ui, sans-serif";
    ctx.letterSpacing = "-1px";
    // Wrap long names if doubles
    if (winnerName.length > 20) {
      const parts = winnerName.split("/");
      if (parts.length > 1) {
        ctx.fillText(parts[0].trim().toUpperCase(), W / 2, 690);
        ctx.fillText(parts[1].trim().toUpperCase(), W / 2, 780);
      } else {
        ctx.font = "900 64px 'Cabinet Grotesk', system-ui, sans-serif";
        ctx.fillText(winnerName.toUpperCase(), W / 2, 720);
      }
    } else {
      ctx.fillText(winnerName.toUpperCase(), W / 2, 710);
    }

    // 7. Score Banner
    const scoreY = 940;
    // Score box
    ctx.fillStyle = "rgba(255, 255, 255, 0.04)";
    ctx.strokeStyle = "rgba(16, 185, 129, 0.4)";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.roundRect(140, scoreY - 80, W - 280, 220, 32);
    ctx.fill();
    ctx.stroke();

    // Sets Won Display (e.g. 2 - 1 or 2 - 0)
    const winGames = gamesWon(match.games, winnerSide);
    const loseGames = gamesWon(match.games, loserSide);
    ctx.fillStyle = "#10b981";
    ctx.font = "bold 32px 'Cabinet Grotesk', system-ui";
    ctx.letterSpacing = "4px";
    ctx.fillText(`SETS WON: ${winGames} – ${loseGames}`, W / 2, scoreY - 20);

    // Individual Game Scores: e.g. 21-19, 18-21, 21-15
    const scoreText = match.games
      .map((g) => `${g[winnerSide]}–${g[loserSide]}`)
      .join("   ·   ");
    ctx.fillStyle = "#ffffff";
    ctx.font = "900 70px 'Cabinet Grotesk', monospace, system-ui";
    ctx.letterSpacing = "2px";
    ctx.fillText(scoreText || "21–18  ·  21–19", W / 2, scoreY + 70);

    // 8. Defeated Opponent Line
    ctx.fillStyle = "#64748b";
    ctx.font = "600 28px 'Cabinet Grotesk', system-ui";
    ctx.letterSpacing = "3px";
    ctx.fillText("DEFEATED", W / 2, 1250);

    ctx.fillStyle = "#cbd5e1";
    ctx.font = "bold 52px 'Cabinet Grotesk', system-ui";
    ctx.letterSpacing = "0px";
    ctx.fillText(loserName.toUpperCase(), W / 2, 1320);

    // 9. Match Metadata Strip
    const dateStr = new Date().toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
    ctx.fillStyle = "#64748b";
    ctx.font = "500 26px system-ui";
    ctx.fillText(`OFFICIAL BWF TOURNAMENT RECORD · ${dateStr}`, W / 2, 1420);

    // 10. Footer Brand Card
    ctx.fillStyle = "rgba(16, 185, 129, 0.1)";
    ctx.strokeStyle = "rgba(16, 185, 129, 0.25)";
    ctx.beginPath();
    ctx.roundRect(140, 1600, W - 280, 160, 24);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = "#ffffff";
    ctx.font = "900 38px 'Cabinet Grotesk', system-ui";
    ctx.letterSpacing = "2px";
    ctx.fillText("BADMINATION", W / 2, 1665);

    ctx.fillStyle = "#10b981";
    ctx.font = "600 24px system-ui";
    ctx.letterSpacing = "2px";
    ctx.fillText("LIVE TOURNAMENTS · FIXTURES · SCORES", W / 2, 1715);

    setDataUrl(canvas.toDataURL("image/png"));
  }, [match, tournamentName, venue, winnerSide, loserSide, winnerName, loserName]);

  const handleDownload = () => {
    if (!dataUrl) return;
    const a = document.createElement("a");
    a.href = dataUrl;
    a.download = `badmination-win-${winnerName.toLowerCase().replace(/[^a-z0-9]+/g, "-")}.png`;
    a.click();
  };

  const handleShare = async () => {
    if (!dataUrl) return;
    try {
      if (navigator.share && navigator.canShare) {
        const blob = await (await fetch(dataUrl)).blob();
        const file = new File([blob], `victory-${winnerName}.png`, { type: "image/png" });
        if (navigator.canShare({ files: [file] })) {
          await navigator.share({
            title: `${winnerName} Victory at ${tournamentName}!`,
            text: `🏸 Match Result: ${winnerName} won the match at ${tournamentName}! Follow live at Badmination.`,
            files: [file],
          });
          setShared(true);
          setTimeout(() => setShared(false), 3000);
          return;
        }
      }
      handleDownload();
    } catch {
      handleDownload();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4 backdrop-blur-md animate-fade-in">
      <div className="relative flex max-h-[92vh] w-full max-w-md flex-col overflow-hidden rounded-3xl border border-off-white/15 bg-charcoal shadow-2xl">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-off-white/10 px-5 py-4">
          <div className="flex items-center gap-2">
            <Trophy className="size-5 text-court-green" />
            <h3 className="font-display text-sm font-bold tracking-[0.14em] uppercase text-off-white">
              Official Match Victory Card
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-muted hover:bg-off-white/10 hover:text-off-white"
          >
            <X className="size-5" />
          </button>
        </div>

        {/* Card Preview Container */}
        <div className="overflow-y-auto p-5 flex flex-col items-center">
          <p className="mb-3 text-xs text-muted text-center">
            Story & status graphic ready to post on WhatsApp, Instagram, or club groups.
          </p>
          <div className="w-64 overflow-hidden rounded-2xl border-2 border-court-green/40 shadow-2xl">
            <canvas ref={canvasRef} className="w-full h-auto" />
          </div>
        </div>

        {/* Modal Action Buttons */}
        <div className="border-t border-off-white/10 bg-off-white/[0.02] p-5">
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={handleShare}
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-court-green px-4 py-2 font-display text-xs font-bold tracking-[0.14em] text-black uppercase hover:bg-off-white transition-all shadow-[0_0_15px_rgba(16,185,129,0.3)]"
            >
              {shared ? <Check className="size-4" /> : <Share2 className="size-4" />}
              <span>{shared ? "Shared!" : "Share Story"}</span>
            </button>
            <button
              type="button"
              onClick={handleDownload}
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-off-white/15 bg-off-white/5 px-4 py-2 font-display text-xs font-bold tracking-[0.14em] text-off-white uppercase hover:border-court-green hover:text-court-green transition-all"
            >
              <Download className="size-4" />
              <span>Save Image</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
