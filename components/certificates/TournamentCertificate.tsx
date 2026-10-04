"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import {
  Printer,
  Download,
  Share2,
  Trophy,
  Award,
  Crown,
  Medal,
  Check,
  ArrowLeft,
  Sparkles,
} from "lucide-react";
import {
  CERTIFICATE_CONFIG,
  formatCertNumber,
  type CertificateType,
} from "@/lib/certificates";
import type { Tournament } from "@/lib/tournaments";
import { formatRange } from "@/lib/tournaments";
import { getWhatsAppGroupShareUrl } from "@/lib/whatsapp";

interface TournamentCertificateProps {
  tournament: Tournament;
  initialName?: string;
  initialType?: CertificateType;
  initialEvent?: string;
  initialReference?: string;
  initialClub?: string;
}

export default function TournamentCertificate({
  tournament,
  initialName = "Badminton Athlete",
  initialType = "winner",
  initialEvent = "Open Singles",
  initialReference = "",
  initialClub = "",
}: TournamentCertificateProps) {
  const [name, setName] = useState(initialName);
  const [type, setType] = useState<CertificateType>(initialType);
  const [event, setEvent] = useState(initialEvent);
  const [club, setClub] = useState(initialClub);
  const [copied, setCopied] = useState(false);
  const [exporting, setExporting] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const config = CERTIFICATE_CONFIG[type];
  const certNumber = formatCertNumber(tournament.slug, initialReference, type);

  const datesFormatted = formatRange(tournament.startDate, tournament.endDate);
  const issueDate = new Intl.DateTimeFormat("en-IN", {
    dateStyle: "long",
    timeZone: "Asia/Kolkata",
  }).format(new Date());

  const handlePrint = () => {
    window.print();
  };

  // Generate high-resolution 2400x1600 canvas for PNG download
  const handleDownload = () => {
    setExporting(true);
    const canvas = canvasRef.current;
    if (!canvas) {
      setExporting(false);
      return;
    }
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      setExporting(false);
      return;
    }

    const W = 2400;
    const H = 1600;
    canvas.width = W;
    canvas.height = H;

    // 1. Parchment Background
    const bg = ctx.createLinearGradient(0, 0, W, H);
    bg.addColorStop(0, "#080c0a");
    bg.addColorStop(0.5, "#0e1513");
    bg.addColorStop(1, "#070b09");
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, W, H);

    // 2. Radial Ambient Glow
    const glow = ctx.createRadialGradient(W / 2, H / 2, 80, W / 2, H / 2, 900);
    glow.addColorStop(0, `${config.accentColor}18`);
    glow.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, W, H);

    // 3. Double Metallic Frame
    ctx.strokeStyle = config.accentColor;
    ctx.lineWidth = 14;
    ctx.strokeRect(60, 60, W - 120, H - 120);

    ctx.strokeStyle = "rgba(255,255,255,0.2)";
    ctx.lineWidth = 3;
    ctx.strokeRect(88, 88, W - 176, H - 176);

    // 4. Corner Ornaments
    const drawOrnament = (x: number, y: number, rot: number) => {
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(rot);
      ctx.fillStyle = config.accentColor;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(50, 0);
      ctx.lineTo(50, 10);
      ctx.lineTo(10, 10);
      ctx.lineTo(10, 50);
      ctx.lineTo(0, 50);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    };
    drawOrnament(96, 96, 0);
    drawOrnament(W - 96, 96, Math.PI / 2);
    drawOrnament(W - 96, H - 96, Math.PI);
    drawOrnament(96, H - 96, -Math.PI / 2);

    // 5. Header Branding
    ctx.fillStyle = config.accentColor;
    ctx.font = "bold 36px 'Plus Jakarta Sans', sans-serif";
    ctx.textAlign = "center";
    ctx.letterSpacing = "8px";
    ctx.fillText("BADMINATION OFFICIAL TOURNAMENT HONOURS", W / 2, 190);

    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 64px Outfit, sans-serif";
    ctx.letterSpacing = "4px";
    ctx.fillText(config.title, W / 2, 280);

    // 6. Subtitle
    ctx.fillStyle = "#9ca3af";
    ctx.font = "italic 32px 'Plus Jakarta Sans', sans-serif";
    ctx.letterSpacing = "1px";
    ctx.fillText(config.subtitle, W / 2, 360);

    // 7. Badge
    ctx.fillStyle = config.accentColor;
    ctx.font = "black 42px Outfit, sans-serif";
    ctx.letterSpacing = "6px";
    ctx.fillText(`★  ${config.badgeText}  ★`, W / 2, 440);

    // 8. Recipient Name
    ctx.fillStyle = "#ffffff";
    ctx.font = "900 84px Outfit, sans-serif";
    ctx.letterSpacing = "2px";
    ctx.fillText(name.toUpperCase(), W / 2, 590);

    // Underline
    ctx.strokeStyle = config.accentColor;
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(W / 2 - 380, 620);
    ctx.lineTo(W / 2 + 380, 620);
    ctx.stroke();

    if (club) {
      ctx.fillStyle = "#9ca3af";
      ctx.font = "600 32px 'Plus Jakarta Sans', sans-serif";
      ctx.fillText(club, W / 2, 670);
    }

    // 9. Event & Tournament
    ctx.fillStyle = "#e5e7eb";
    ctx.font = "bold 44px 'Plus Jakarta Sans', sans-serif";
    ctx.fillText(`Event: ${event}`, W / 2, 760);

    ctx.fillStyle = "#9ca3af";
    ctx.font = "32px 'Plus Jakarta Sans', sans-serif";
    ctx.fillText(`${tournament.name} · ${tournament.venue}, ${tournament.city}`, W / 2, 830);
    ctx.fillText(datesFormatted, W / 2, 880);

    // 10. Official Seal & Signatures
    // Seal circle on center bottom
    const sealX = W / 2;
    const sealY = 1140;
    ctx.strokeStyle = config.accentColor;
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.arc(sealX, sealY, 95, 0, Math.PI * 2);
    ctx.stroke();

    ctx.strokeStyle = "rgba(255,255,255,0.4)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(sealX, sealY, 82, 0, Math.PI * 2);
    ctx.stroke();

    ctx.fillStyle = config.accentColor;
    ctx.font = "bold 24px Outfit, sans-serif";
    ctx.fillText("BADMINATION", sealX, sealY - 20);
    ctx.fillText("★ OFFICIAL ★", sealX, sealY + 14);
    ctx.fillText("VERIFIED SEAL", sealX, sealY + 45);

    // Left Signature: Tournament Director
    ctx.strokeStyle = "#9ca3af";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(340, 1260);
    ctx.lineTo(660, 1260);
    ctx.stroke();

    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 30px 'Plus Jakarta Sans', sans-serif";
    ctx.fillText("Tournament Director", 500, 1310);
    ctx.fillStyle = "#9ca3af";
    ctx.font = "24px 'Plus Jakarta Sans', sans-serif";
    ctx.fillText("Organizing Committee", 500, 1350);

    // Right Signature: Chief Referee
    ctx.strokeStyle = "#9ca3af";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(W - 660, 1260);
    ctx.lineTo(W - 340, 1260);
    ctx.stroke();

    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 30px 'Plus Jakarta Sans', sans-serif";
    ctx.fillText("Chief Referee", W - 500, 1310);
    ctx.fillStyle = "#9ca3af";
    ctx.font = "24px 'Plus Jakarta Sans', sans-serif";
    ctx.fillText("BWF Certified Official", W - 500, 1350);

    // 11. Footer Verification Info
    ctx.fillStyle = "#6b7280";
    ctx.font = "mono 22px monospace";
    ctx.textAlign = "left";
    ctx.fillText(`Verification ID: ${certNumber}`, 120, 1480);
    ctx.fillText(`Issued: ${issueDate}`, 120, 1515);

    ctx.textAlign = "right";
    ctx.fillText("Secured by Badmination Tournament Engine", W - 120, 1480);
    ctx.fillText("badmination.com/verify", W - 120, 1515);

    // Trigger PNG Download
    const dataUrl = canvas.toDataURL("image/png");
    const link = document.createElement("a");
    link.download = `${name.replace(/\s+/g, "_")}_${config.rankLabel}_Certificate.png`;
    link.href = dataUrl;
    link.click();
    setExporting(false);
  };

  const shareText =
    `🏸 Official Tournament Certificate\n` +
    `🏅 ${name} — ${config.badgeText}\n` +
    `🏆 ${tournament.name} (${event})\n` +
    `🔖 Verification ID: ${certNumber}\n` +
    `🔗 https://badmination.com/tournaments/${tournament.slug}/certificate?name=${encodeURIComponent(
      name
    )}&type=${type}&event=${encodeURIComponent(event)}`;

  const waShareUrl = getWhatsAppGroupShareUrl(shareText);

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // clipboard fallback
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-off-white pb-20">
      {/* Top Floating Control Toolbar (Hidden during print) */}
      <div className="no-print sticky top-0 z-40 border-b border-off-white/10 bg-black/90 px-4 py-3 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link
              href={`/tournaments/${tournament.slug}/live`}
              className="inline-flex items-center gap-1.5 rounded-lg border border-off-white/15 px-3 py-1.5 text-xs font-semibold text-muted hover:border-court-green/40 hover:text-off-white"
            >
              <ArrowLeft className="size-4" />
              <span>Back</span>
            </Link>

            <div>
              <span className="font-display text-sm font-bold uppercase tracking-wider text-off-white">
                Official Certificate Station
              </span>
              <span className="block text-[11px] text-muted">
                {tournament.name} · {certNumber}
              </span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="inline-flex min-h-10 items-center gap-2 rounded-xl bg-off-white px-4 py-2 font-display text-xs font-bold uppercase tracking-wider text-black hover:bg-court-green transition-all shadow-md"
            >
              <Printer className="size-4" />
              <span>Print / PDF (A4)</span>
            </button>

            <button
              type="button"
              disabled={exporting}
              onClick={handleDownload}
              className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-court-green/40 bg-court-green/10 px-4 py-2 font-display text-xs font-bold tracking-wider uppercase text-court-green hover:bg-court-green hover:text-black transition-all"
            >
              <Download className="size-4" />
              <span>{exporting ? "Generating…" : "Download 4K PNG"}</span>
            </button>

            <a
              href={waShareUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-10 items-center gap-2 rounded-xl bg-[#25D366] px-3.5 py-2 font-display text-xs font-bold uppercase tracking-wider text-black hover:bg-[#20ba59] transition-all shadow-sm"
              title="Share on WhatsApp"
            >
              <Share2 className="size-4" />
              <span className="hidden sm:inline">WhatsApp</span>
            </a>

            <button
              type="button"
              onClick={copyLink}
              className="inline-flex min-h-10 items-center gap-1.5 rounded-xl border border-off-white/15 px-3 py-2 text-xs font-semibold text-muted hover:text-off-white hover:bg-off-white/5"
              title="Copy verification link"
            >
              {copied ? <Check className="size-4 text-court-green" /> : <Sparkles className="size-4" />}
              <span>{copied ? "Copied" : "Copy Link"}</span>
            </button>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-5xl px-4 pt-6 space-y-6">
        {/* Certificate Customization Bar (Hidden when printed) */}
        <div className="no-print rounded-2xl border border-off-white/10 bg-off-white/[0.03] p-4 sm:p-5 backdrop-blur-sm space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-off-white/10 pb-3">
            <span className="font-display text-xs font-bold tracking-wider uppercase text-muted">
              Select Certificate Honour:
            </span>

            {/* Type selector buttons */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 w-full sm:w-auto">
              <button
                type="button"
                onClick={() => setType("winner")}
                className={`inline-flex items-center justify-center gap-1.5 rounded-xl px-3 py-2 font-display text-xs font-bold uppercase transition-all ${
                  type === "winner"
                    ? "bg-[#D4AF37] text-black shadow-[0_0_15px_rgba(212,175,55,0.4)]"
                    : "border border-off-white/15 bg-black/40 text-muted hover:text-off-white"
                }`}
              >
                <Crown className="size-3.5" />
                <span>Champion</span>
              </button>

              <button
                type="button"
                onClick={() => setType("runner_up")}
                className={`inline-flex items-center justify-center gap-1.5 rounded-xl px-3 py-2 font-display text-xs font-bold uppercase transition-all ${
                  type === "runner_up"
                    ? "bg-[#C0C0C0] text-black shadow-[0_0_15px_rgba(192,192,192,0.4)]"
                    : "border border-off-white/15 bg-black/40 text-muted hover:text-off-white"
                }`}
              >
                <Medal className="size-3.5" />
                <span>Runner-Up</span>
              </button>

              <button
                type="button"
                onClick={() => setType("semi_finalist")}
                className={`inline-flex items-center justify-center gap-1.5 rounded-xl px-3 py-2 font-display text-xs font-bold uppercase transition-all ${
                  type === "semi_finalist"
                    ? "bg-[#CD7F32] text-black shadow-[0_0_15px_rgba(205,127,50,0.4)]"
                    : "border border-off-white/15 bg-black/40 text-muted hover:text-off-white"
                }`}
              >
                <Trophy className="size-3.5" />
                <span>Semi-Final</span>
              </button>

              <button
                type="button"
                onClick={() => setType("participation")}
                className={`inline-flex items-center justify-center gap-1.5 rounded-xl px-3 py-2 font-display text-xs font-bold uppercase transition-all ${
                  type === "participation"
                    ? "bg-court-green text-black shadow-[0_0_15px_rgba(16,185,129,0.4)]"
                    : "border border-off-white/15 bg-black/40 text-muted hover:text-off-white"
                }`}
              >
                <Award className="size-3.5" />
                <span>Participant</span>
              </button>
            </div>
          </div>

          {/* Quick-edit Inputs */}
          <div className="grid gap-3 sm:grid-cols-3">
            <div>
              <label htmlFor="recipient-name" className="block text-[11px] font-semibold text-muted uppercase tracking-wider mb-1">
                Player Name:
              </label>
              <input
                id="recipient-name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded-xl border border-off-white/15 bg-black/50 px-3 py-2 text-sm text-off-white focus:border-court-green focus:outline-none"
              />
            </div>

            <div>
              <label htmlFor="event-name" className="block text-[11px] font-semibold text-muted uppercase tracking-wider mb-1">
                Event / Category:
              </label>
              <input
                id="event-name"
                type="text"
                value={event}
                onChange={(e) => setEvent(e.target.value)}
                className="w-full rounded-xl border border-off-white/15 bg-black/50 px-3 py-2 text-sm text-off-white focus:border-court-green focus:outline-none"
              />
            </div>

            <div>
              <label htmlFor="club-name" className="block text-[11px] font-semibold text-muted uppercase tracking-wider mb-1">
                Club / Academy (Optional):
              </label>
              <input
                id="club-name"
                type="text"
                value={club}
                onChange={(e) => setClub(e.target.value)}
                placeholder="e.g. Gopichand Academy"
                className="w-full rounded-xl border border-off-white/15 bg-black/50 px-3 py-2 text-sm text-off-white focus:border-court-green focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Certificate Display Card (Full Visual Layout) */}
        <div
          id="certificate-print-area"
          className="relative mx-auto aspect-[1.5/1] w-full rounded-2xl border-8 p-6 sm:p-12 shadow-2xl overflow-hidden print:border-8 print:p-8 print:shadow-none print:aspect-auto print:min-h-[190mm]"
          style={{
            borderColor: config.accentColor,
            backgroundColor: "#080c0a",
          }}
        >
          {/* Subtle Inner Border Frame */}
          <div
            className="pointer-events-none absolute inset-3 sm:inset-5 rounded-xl border-2 border-white/20"
            aria-hidden="true"
          />

          {/* Corner Ornaments */}
          <div
            className="absolute top-4 left-4 size-8 border-t-4 border-l-4"
            style={{ borderColor: config.accentColor }}
          />
          <div
            className="absolute top-4 right-4 size-8 border-t-4 border-r-4"
            style={{ borderColor: config.accentColor }}
          />
          <div
            className="absolute bottom-4 left-4 size-8 border-b-4 border-l-4"
            style={{ borderColor: config.accentColor }}
          />
          <div
            className="absolute bottom-4 right-4 size-8 border-b-4 border-r-4"
            style={{ borderColor: config.accentColor }}
          />

          {/* Radial Ambient Center Glow */}
          <div
            className="pointer-events-none absolute inset-0 opacity-20"
            style={{
              background: `radial-gradient(circle at center, ${config.accentColor} 0%, transparent 70%)`,
            }}
          />

          {/* Certificate Content */}
          <div className="relative z-10 flex h-full flex-col justify-between text-center">
            {/* Header */}
            <div>
              <p
                className="font-display text-[10px] sm:text-xs font-bold tracking-[0.28em] uppercase"
                style={{ color: config.accentColor }}
              >
                Badmination Official Tournament Honours
              </p>
              <h1 className="mt-2 font-display text-xl sm:text-3xl lg:text-4xl font-black uppercase tracking-tight text-white">
                {config.title}
              </h1>
              <p className="mt-1 text-xs sm:text-sm text-zinc-400 italic">
                {config.subtitle}
              </p>
              <div
                className="mt-2 inline-flex items-center gap-2 rounded-full border px-4 py-1 font-display text-[11px] sm:text-xs font-black uppercase tracking-widest shadow-sm"
                style={{
                  borderColor: `${config.accentColor}60`,
                  backgroundColor: config.ribbonColor,
                  color: config.accentColor,
                }}
              >
                <span>★ {config.badgeText} ★</span>
              </div>
            </div>

            {/* Recipient Details */}
            <div className="my-4 sm:my-6 space-y-2">
              <p className="font-display text-3xl sm:text-5xl lg:text-6xl font-black uppercase tracking-tight text-white">
                {name}
              </p>
              <div
                className="mx-auto h-1 w-48 sm:w-80 rounded-full"
                style={{ backgroundColor: config.accentColor }}
              />
              {club && (
                <p className="text-xs sm:text-sm font-medium text-zinc-400">{club}</p>
              )}
            </div>

            {/* Event & Tournament Record */}
            <div className="space-y-1">
              <p className="font-display text-base sm:text-xl font-bold text-white">
                {event}
              </p>
              <p className="text-xs sm:text-sm text-zinc-300">
                {tournament.name} · {tournament.venue}, {tournament.city}
              </p>
              <p className="text-[11px] sm:text-xs text-zinc-500 font-medium">
                {datesFormatted}
              </p>
            </div>

            {/* Seal & Signatures Footer */}
            <div className="mt-6 flex items-end justify-between border-t border-white/10 pt-4 text-xs">
              {/* Left: Tournament Director */}
              <div className="text-left w-1/3">
                <div className="h-6 sm:h-8" />
                <div className="border-b border-zinc-500 w-3/4 sm:w-2/3" />
                <p className="mt-1 font-display text-[10px] sm:text-xs font-bold uppercase tracking-wider text-white">
                  Tournament Director
                </p>
                <p className="text-[9px] sm:text-[10px] text-zinc-500">
                  Organizing Committee
                </p>
              </div>

              {/* Center: Official Seal Emblem */}
              <div className="flex flex-col items-center">
                <div
                  className="flex size-14 sm:size-20 items-center justify-center rounded-full border-2 p-1 text-center shadow-lg"
                  style={{
                    borderColor: config.accentColor,
                    backgroundColor: "rgba(0,0,0,0.6)",
                  }}
                >
                  <div
                    className="flex size-full flex-col items-center justify-center rounded-full border border-dashed p-1"
                    style={{ borderColor: config.accentColor }}
                  >
                    <Trophy className="size-4 sm:size-6" style={{ color: config.accentColor }} />
                    <span
                      className="font-display text-[7px] sm:text-[8px] font-black uppercase tracking-widest mt-0.5"
                      style={{ color: config.accentColor }}
                    >
                      Official Seal
                    </span>
                  </div>
                </div>
              </div>

              {/* Right: Chief Referee */}
              <div className="text-right w-1/3 flex flex-col items-end">
                <div className="h-6 sm:h-8" />
                <div className="border-b border-zinc-500 w-3/4 sm:w-2/3" />
                <p className="mt-1 font-display text-[10px] sm:text-xs font-bold uppercase tracking-wider text-white">
                  Chief Referee
                </p>
                <p className="text-[9px] sm:text-[10px] text-zinc-500">
                  BWF Certified Official
                </p>
              </div>
            </div>

            {/* Security Verification Footprint */}
            <div className="mt-4 flex flex-wrap items-center justify-between text-[9px] sm:text-[10px] text-zinc-600 font-mono">
              <span>Verification Ref: {certNumber}</span>
              <span>Issued: {issueDate}</span>
              <span>badmination.com/verify</span>
            </div>
          </div>
        </div>

        {/* Hidden Canvas for High-Res PNG Rendering */}
        <canvas ref={canvasRef} className="hidden" aria-hidden="true" />
      </div>
    </div>
  );
}
