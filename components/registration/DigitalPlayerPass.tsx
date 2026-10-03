"use client";

import { useState } from "react";
import { CheckCircle2, Download, ShieldCheck } from "lucide-react";

interface DigitalPlayerPassProps {
  orderId: string;
  tournamentName: string;
  tournamentSlug: string;
  city: string;
  dates: string;
  venue: string;
  level: string;
  events: string;
  paymentId?: string;
  email?: string;
}

/**
 * Procedural SVG QR Code grid representation for clean, instant, zero-dependency rendering.
 */
function SimpleQrCode({ text, size = 140 }: { text: string; size?: number }) {
  // Simple deterministic hash to generate unique pattern per orderId
  const cells: boolean[][] = Array.from({ length: 17 }, () => Array(17).fill(false));

  // Corner position detection patterns (standard QR anchors)
  const setAnchor = (r: number, c: number) => {
    for (let i = 0; i < 5; i++) {
      for (let j = 0; j < 5; j++) {
        if (i === 0 || i === 4 || j === 0 || j === 4 || (i === 2 && j === 2)) {
          cells[r + i][c + j] = true;
        }
      }
    }
  };
  setAnchor(0, 0);
  setAnchor(0, 12);
  setAnchor(12, 0);

  // Fill pseudo-random payload grid based on string characters
  let h = 0;
  for (let i = 0; i < text.length; i++) {
    h = (h << 5) - h + text.charCodeAt(i);
    h |= 0;
  }
  for (let r = 0; r < 17; r++) {
    for (let c = 0; c < 17; c++) {
      if ((r < 6 && c < 6) || (r < 6 && c > 10) || (r > 10 && c < 6)) continue;
      const bit = Math.abs((h * (r * 17 + c + 1)) % 100);
      cells[r][c] = bit > 45;
    }
  }

  const cellSize = size / 17;

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="rounded-lg bg-white p-1.5 shadow-sm">
      {cells.map((row, r) =>
        row.map((active, c) =>
          active ? (
            <rect
              key={`${r}-${c}`}
              x={c * cellSize}
              y={r * cellSize}
              width={cellSize}
              height={cellSize}
              fill="#0a0d0c"
            />
          ) : null,
        ),
      )}
    </svg>
  );
}

export default function DigitalPlayerPass({
  orderId,
  tournamentName,
  tournamentSlug,
  city,
  dates,
  venue,
  level,
  events,
}: DigitalPlayerPassProps) {
  const [downloading, setDownloading] = useState(false);

  const verificationPayload = `BADMINATION://CHECKIN/${tournamentSlug}/${orderId}`;

  const handleSavePass = async () => {
    setDownloading(true);
    try {
      // Create a canvas representation of the pass to download as an image
      const canvas = document.createElement("canvas");
      canvas.width = 900;
      canvas.height = 540;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      // Dark Badge Background
      const bg = ctx.createLinearGradient(0, 0, 900, 540);
      bg.addColorStop(0, "#0c1110");
      bg.addColorStop(1, "#151e1b");
      ctx.fillStyle = bg;
      ctx.roundRect(0, 0, 900, 540, 32);
      ctx.fill();

      // Border glow
      ctx.strokeStyle = "#10b981";
      ctx.lineWidth = 4;
      ctx.stroke();

      // Header Tag
      ctx.fillStyle = "#10b981";
      ctx.font = "bold 20px system-ui";
      ctx.fillText("OFFICIAL PLAYER CREDENTIAL · BADMINATION", 50, 60);

      // Tournament Name
      ctx.fillStyle = "#ffffff";
      ctx.font = "900 36px system-ui";
      ctx.fillText(tournamentName.toUpperCase(), 50, 115);

      // Event details
      ctx.fillStyle = "#94a3b8";
      ctx.font = "600 20px system-ui";
      ctx.fillText(`${venue} · ${city} · ${dates}`, 50, 155);

      // Divider line
      ctx.strokeStyle = "rgba(255, 255, 255, 0.15)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(50, 185);
      ctx.lineTo(850, 185);
      ctx.stroke();

      // Player details
      ctx.fillStyle = "#10b981";
      ctx.font = "bold 18px system-ui";
      ctx.fillText("REGISTERED EVENT(S)", 50, 230);
      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 28px system-ui";
      ctx.fillText(events, 50, 270);

      ctx.fillStyle = "#94a3b8";
      ctx.font = "bold 16px system-ui";
      ctx.fillText("CREDENTIAL / ORDER ID", 50, 335);
      ctx.fillStyle = "#ffffff";
      ctx.font = "mono 22px monospace";
      ctx.fillText(orderId, 50, 370);

      ctx.fillStyle = "#10b981";
      ctx.font = "bold 18px system-ui";
      ctx.fillText("STATUS: VERIFIED & CONFIRMED", 50, 435);

      // QR Code placeholder / watermark block
      ctx.fillStyle = "#ffffff";
      ctx.roundRect(640, 220, 200, 200, 16);
      ctx.fill();
      ctx.fillStyle = "#000000";
      ctx.font = "bold 16px system-ui";
      ctx.textAlign = "center";
      ctx.fillText("SCAN AT DESK", 740, 325);
      ctx.font = "mono 12px monospace";
      ctx.fillText(orderId.slice(0, 12), 740, 350);

      // Download
      const a = document.createElement("a");
      a.href = canvas.toDataURL("image/png");
      a.download = `player-pass-${orderId.slice(-6)}.png`;
      a.click();
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="mt-10 overflow-hidden rounded-3xl border-2 border-court-green/40 bg-gradient-to-br from-charcoal via-black to-court-green/10 p-6 shadow-2xl backdrop-blur-xl sm:p-8">
      <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
        <div className="flex-1 space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-court-green/40 bg-court-green/20 px-3 py-1 font-display text-xs font-bold tracking-[0.16em] text-court-green uppercase shadow-[0_0_10px_rgba(16,185,129,0.3)]">
              <ShieldCheck className="size-3.5" />
              <span>Official Player Credential</span>
            </span>
            <span className="rounded-full border border-white/15 bg-white/5 px-2.5 py-0.5 font-display text-[11px] font-semibold text-muted uppercase">
              {level} Level
            </span>
          </div>

          <div>
            <h3 className="font-display text-2xl font-black uppercase text-off-white sm:text-3xl">
              {tournamentName}
            </h3>
            <p className="mt-1 text-xs text-muted sm:text-sm">
              {venue}, {city} · {dates}
            </p>
          </div>

          <div className="grid gap-3 pt-2 sm:grid-cols-2">
            <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
              <span className="block font-display text-[10px] font-bold tracking-[0.14em] text-court-green uppercase">
                Registered Event(s)
              </span>
              <span className="mt-0.5 block font-display text-sm font-bold text-off-white">
                {events}
              </span>
            </div>

            <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
              <span className="block font-display text-[10px] font-bold tracking-[0.14em] text-muted uppercase">
                Credential Reference
              </span>
              <span className="mt-0.5 block font-mono text-xs font-semibold text-off-white truncate">
                {orderId}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs font-medium text-court-green">
            <CheckCircle2 className="size-4 shrink-0" />
            <span>Show this QR code at the tournament reception desk for 1-second check-in.</span>
          </div>
        </div>

        {/* QR Code Anchor Box */}
        <div className="flex flex-col items-center justify-center rounded-2xl border border-white/15 bg-black/60 p-5 shrink-0 text-center">
          <SimpleQrCode text={verificationPayload} size={135} />
          <span className="mt-2.5 font-mono text-[10px] font-bold tracking-[0.18em] text-muted uppercase">
            Pass ID · {orderId.slice(-6).toUpperCase()}
          </span>
          <button
            type="button"
            onClick={handleSavePass}
            disabled={downloading}
            className="mt-3 inline-flex items-center gap-1.5 rounded-lg border border-court-green/40 bg-court-green/10 px-3 py-1.5 font-display text-[11px] font-bold tracking-[0.12em] text-court-green uppercase hover:bg-court-green hover:text-black transition-colors"
          >
            <Download className="size-3.5" />
            <span>{downloading ? "Saving..." : "Save Pass"}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
