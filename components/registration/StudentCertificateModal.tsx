"use client";

import { useEffect, useRef, useState } from "react";
import { Award, Download, Printer, School, Share2, X } from "lucide-react";

interface StudentCertificateModalProps {
  isOpen: boolean;
  onClose: () => void;
  studentName: string;
  institution?: string;
  studentId?: string;
  tournamentName: string;
  tournamentCity: string;
  tournamentVenue: string;
  dates: string;
  events: string;
  reference: string;
}

export default function StudentCertificateModal({
  isOpen,
  onClose,
  studentName,
  institution = "Independent Student Athlete",
  studentId,
  tournamentName,
  tournamentCity,
  tournamentVenue,
  dates,
  events,
  reference,
}: StudentCertificateModalProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [downloading, setDownloading] = useState(false);
  const [copied, setCopied] = useState(false);

  const certNumber = `CERT-${reference.replace("REG-", "").slice(0, 8)}-${dates.slice(-4)}`;

  // Draw the high-resolution certificate on the canvas
  useEffect(() => {
    if (!isOpen) return;

    // Small delay to ensure canvas is mounted in DOM
    const timer = setTimeout(() => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const W = 2400;
      const H = 1600;
      canvas.width = W;
      canvas.height = H;

      // 1. Pristine Parchment Background
      const bg = ctx.createLinearGradient(0, 0, W, H);
      bg.addColorStop(0, "#080c0a");
      bg.addColorStop(0.5, "#0d1412");
      bg.addColorStop(1, "#070b09");
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, W, H);

      // 2. Subtle luxury radial watermark in center
      const radialGlow = ctx.createRadialGradient(W / 2, H / 2, 50, W / 2, H / 2, 800);
      radialGlow.addColorStop(0, "rgba(16, 185, 129, 0.08)");
      radialGlow.addColorStop(1, "rgba(0, 0, 0, 0)");
      ctx.fillStyle = radialGlow;
      ctx.fillRect(0, 0, W, H);

      // 3. Luxurious Double Border (Emerald & Gold)
      // Outer Gold Frame
      ctx.strokeStyle = "#d4af37";
      ctx.lineWidth = 14;
      ctx.strokeRect(60, 60, W - 120, H - 120);

      // Inner Emerald Thin Frame
      ctx.strokeStyle = "#10b981";
      ctx.lineWidth = 4;
      ctx.strokeRect(88, 88, W - 176, H - 176);

      // Corner Accents (Art Deco style)
      const drawCorner = (x: number, y: number, rot: number) => {
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(rot);
        ctx.fillStyle = "#d4af37";
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(40, 0);
        ctx.lineTo(40, 10);
        ctx.lineTo(10, 10);
        ctx.lineTo(10, 40);
        ctx.lineTo(0, 40);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
      };
      drawCorner(96, 96, 0);
      drawCorner(W - 96, 96, Math.PI / 2);
      drawCorner(W - 96, H - 96, Math.PI);
      drawCorner(96, H - 96, -Math.PI / 2);

      // 4. Header Titles
      ctx.textAlign = "center";
      
      // Top Organization Crest / Badge
      ctx.fillStyle = "#10b981";
      ctx.font = "bold 32px system-ui";
      ctx.letterSpacing = "10px";
      ctx.fillText("BADMINATION ATHLETIC & TOURNAMENT BOARD", W / 2, 190);

      // Subtitle
      ctx.fillStyle = "#d4af37";
      ctx.font = "600 24px system-ui";
      ctx.letterSpacing = "6px";
      ctx.fillText("OFFICIAL STUDENT RECOGNITION & SPORTS QUOTA RECORD", W / 2, 240);

      // Main Certificate Heading
      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 92px system-ui";
      ctx.letterSpacing = "4px";
      ctx.fillText("CERTIFICATE OF PARTICIPATION", W / 2, 360);

      // Gold Divider Line with Diamond Center
      ctx.strokeStyle = "rgba(212, 175, 55, 0.6)";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(W / 2 - 380, 410);
      ctx.lineTo(W / 2 + 380, 410);
      ctx.stroke();

      ctx.fillStyle = "#d4af37";
      ctx.beginPath();
      ctx.arc(W / 2, 410, 8, 0, Math.PI * 2);
      ctx.fill();

      // Certify text
      ctx.fillStyle = "#94a3b8";
      ctx.font = "italic 36px Georgia, serif";
      ctx.letterSpacing = "2px";
      ctx.fillText("This is proudly presented to", W / 2, 490);

      // Student Name (Prominent & Majestic)
      ctx.fillStyle = "#10b981";
      ctx.font = "900 84px system-ui";
      ctx.letterSpacing = "2px";
      ctx.fillText(studentName.toUpperCase(), W / 2, 600);

      // Institution / School affiliation
      ctx.fillStyle = "#ffffff";
      ctx.font = "600 38px system-ui";
      ctx.letterSpacing = "1px";
      const instText = studentId ? `representing ${institution} (Roll/Student ID: ${studentId})` : `representing ${institution}`;
      ctx.fillText(instText, W / 2, 675);

      // Narrative of achievement & participation
      ctx.fillStyle = "#cbd5e1";
      ctx.font = "400 32px system-ui";
      ctx.letterSpacing = "1px";
      ctx.fillText(`for exemplary sportsmanship and competitive performance in`, W / 2, 765);

      ctx.fillStyle = "#d4af37";
      ctx.font = "bold 52px system-ui";
      ctx.letterSpacing = "2px";
      ctx.fillText(tournamentName.toUpperCase(), W / 2, 850);

      // Event & Venue specifics
      ctx.fillStyle = "#94a3b8";
      ctx.font = "500 32px system-ui";
      ctx.fillText(
        `held at ${tournamentVenue}, ${tournamentCity} · ${dates}`,
        W / 2,
        925
      );

      ctx.fillStyle = "#10b981";
      ctx.font = "bold 34px system-ui";
      ctx.fillText(`Division / Event(s): ${events}`, W / 2, 995);

      // Bottom Row: Hologram Seal, Signatures, Verification Code
      const bottomY = 1260;

      // Left Signature: Tournament Director
      ctx.strokeStyle = "#64748b";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(300, bottomY);
      ctx.lineTo(650, bottomY);
      ctx.stroke();

      // Stylized digital signature curve
      ctx.strokeStyle = "#10b981";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(330, bottomY - 35);
      ctx.bezierCurveTo(400, bottomY - 80, 480, bottomY + 10, 560, bottomY - 45);
      ctx.stroke();

      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 26px system-ui";
      ctx.fillText("Vikramaditya Sengupta", 475, bottomY + 45);
      ctx.fillStyle = "#94a3b8";
      ctx.font = "20px system-ui";
      ctx.fillText("Tournament Director", 475, bottomY + 80);

      // Center: Official Gold Foil Seal / Medallion
      const sealX = W / 2;
      const sealY = bottomY - 40;
      
      // Starburst / scalloped seal
      ctx.fillStyle = "#d4af37";
      ctx.beginPath();
      ctx.arc(sealX, sealY, 110, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = "#0c1110";
      ctx.beginPath();
      ctx.arc(sealX, sealY, 96, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = "#d4af37";
      ctx.font = "bold 18px system-ui";
      ctx.letterSpacing = "2px";
      ctx.fillText("★ OFFICIAL MERIT ★", sealX, sealY - 25);
      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 30px system-ui";
      ctx.fillText("VALIDATED", sealX, sealY + 15);
      ctx.fillStyle = "#10b981";
      ctx.font = "bold 16px system-ui";
      ctx.fillText("SPORTS BOARD", sealX, sealY + 45);

      // Right Signature: Chief Referee
      ctx.strokeStyle = "#64748b";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(W - 650, bottomY);
      ctx.lineTo(W - 300, bottomY);
      ctx.stroke();

      // Stylized digital signature curve
      ctx.strokeStyle = "#10b981";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(W - 610, bottomY - 40);
      ctx.bezierCurveTo(W - 540, bottomY - 10, W - 460, bottomY - 70, W - 380, bottomY - 30);
      ctx.stroke();

      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 26px system-ui";
      ctx.fillText("Dr. Shalini Ramanathan", W - 475, bottomY + 45);
      ctx.fillStyle = "#94a3b8";
      ctx.font = "20px system-ui";
      ctx.fillText("Chief National Referee (Grade 1)", W - 475, bottomY + 80);

      // Footer: Verification Code & QR metadata
      ctx.fillStyle = "rgba(255, 255, 255, 0.4)";
      ctx.font = "mono 22px monospace";
      ctx.letterSpacing = "3px";
      ctx.fillText(`AUTHENTICATION ID: ${certNumber} · VERIFIED AT BADMINATION.COM/VERIFY`, W / 2, 1490);
    }, 100);

    return () => clearTimeout(timer);
  }, [isOpen, studentName, institution, studentId, tournamentName, tournamentCity, tournamentVenue, dates, events, reference, certNumber]);

  if (!isOpen) return null;

  const handleDownload = () => {
    setDownloading(true);
    try {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const link = document.createElement("a");
      link.download = `Certificate-${studentName.replace(/\s+/g, "_")}-${certNumber}.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
    } finally {
      setDownloading(false);
    }
  };

  const handlePrint = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dataUrl = canvas.toDataURL("image/png");
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;
    printWindow.document.write(`
      <html>
        <head>
          <title>Certificate - ${studentName}</title>
          <style>
            @page { size: landscape; margin: 0; }
            body { margin: 0; display: flex; align-items: center; justify-content: center; background: #000; min-height: 100vh; }
            img { width: 100%; height: 100%; object-fit: contain; }
          </style>
        </head>
        <body>
          <img src="${dataUrl}" onload="window.print();window.close();" />
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/png"));
        if (blob) {
          const file = new File([blob], `Certificate-${studentName}.png`, { type: "image/png" });
          await navigator.share({
            title: `Student Participation Certificate - ${studentName}`,
            text: `Proud to share my Official Badminton Participation Certificate for ${tournamentName} representing ${institution}!`,
            files: [file],
          });
          return;
        }
      } catch {
        // Fallback below
      }
    }
    // Fallback: copy link/verification code
    await navigator.clipboard.writeText(`Official Certificate for ${studentName} (${institution}) - ID: ${certNumber}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="cert-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md animate-in fade-in duration-200"
    >
      <div className="relative flex flex-col w-full max-w-5xl max-h-[92vh] overflow-hidden rounded-3xl border border-court-green/40 bg-charcoal shadow-2xl">
        {/* Modal Top Bar */}
        <div className="flex items-center justify-between border-b border-off-white/10 px-6 py-4 bg-black/60">
          <div className="flex items-center gap-3">
            <span className="flex size-9 items-center justify-center rounded-xl bg-court-green/20 text-court-green">
              <Award className="size-5" />
            </span>
            <div>
              <h2 id="cert-modal-title" className="font-display text-lg font-bold text-off-white uppercase sm:text-xl">
                Official Student Certificate
              </h2>
              <p className="text-xs text-muted">
                Eligible for school sports quota, college athletic credits, and junior ranking records.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close certificate dialog"
            className="rounded-full p-2 text-muted hover:bg-white/10 hover:text-off-white transition-colors"
          >
            <X className="size-5" />
          </button>
        </div>

        {/* Certificate Canvas Preview (Responsive viewport) */}
        <div className="relative flex-1 overflow-auto p-4 sm:p-6 flex items-center justify-center bg-black/80">
          <canvas
            ref={canvasRef}
            className="w-full max-w-4xl h-auto aspect-[3/2] rounded-xl shadow-2xl border border-white/10"
            style={{ imageRendering: "crisp-edges" }}
          />
        </div>

        {/* Action Buttons Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-off-white/10 bg-black/70 px-6 py-4">
          <div className="flex items-center gap-2 text-xs text-muted">
            <School className="size-4 text-court-green" />
            <span>Institution: <strong className="text-white">{institution}</strong></span>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={handleShare}
              className="inline-flex items-center gap-2 rounded-xl border border-white/20 bg-white/5 px-4 py-2.5 font-display text-xs font-semibold text-off-white uppercase hover:border-court-green hover:text-court-green transition-colors"
            >
              <Share2 className="size-4" />
              <span>{copied ? "Copied!" : "Share Certificate"}</span>
            </button>

            <button
              type="button"
              onClick={handlePrint}
              className="inline-flex items-center gap-2 rounded-xl border border-white/20 bg-white/5 px-4 py-2.5 font-display text-xs font-semibold text-off-white uppercase hover:border-court-green hover:text-court-green transition-colors"
            >
              <Printer className="size-4" />
              <span>Print / PDF</span>
            </button>

            <button
              type="button"
              onClick={handleDownload}
              disabled={downloading}
              className="inline-flex items-center gap-2 rounded-xl bg-court-green px-5 py-2.5 font-display text-xs font-bold text-black uppercase hover:bg-off-white transition-colors shadow-lg shadow-court-green/20"
            >
              <Download className="size-4" />
              <span>{downloading ? "Exporting..." : "Download High-Res PNG"}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
