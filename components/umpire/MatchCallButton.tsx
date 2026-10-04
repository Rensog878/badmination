"use client";

import { useState, useTransition } from "react";
import { Megaphone, Share2, Check, Copy, X, ExternalLink } from "lucide-react";
import { callMatchAction } from "@/app/umpire/actions";
import { buildMatchCallMessage, getWhatsAppGroupShareUrl } from "@/lib/whatsapp";
import type { LiveMatch } from "@/lib/live/types";
import { sideName } from "@/components/live/CourtCard";

interface MatchCallButtonProps {
  slug: string;
  match: LiveMatch;
  tournamentName: string;
  courtsCount?: number;
}

export default function MatchCallButton({
  slug,
  match,
  tournamentName,
  courtsCount = 4,
}: MatchCallButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedCourt, setSelectedCourt] = useState<number>(match.calledToCourt ?? 1);
  const [calledCourt, setCalledCourt] = useState<number | null>(match.calledToCourt ?? null);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const sideA = sideName(match, "a");
  const sideB = sideName(match, "b");

  const messageText = buildMatchCallMessage({
    tournamentName,
    court: selectedCourt,
    sideA,
    sideB,
    event: match.event,
    round: match.round,
    tournamentSlug: slug,
  });

  const waShareUrl = getWhatsAppGroupShareUrl(messageText);

  const handleCall = () => {
    setError(null);
    startTransition(async () => {
      const res = await callMatchAction(slug, match.id, selectedCourt);
      if (res.ok) {
        setCalledCourt(selectedCourt);
      } else {
        setError(res.error || "Failed to broadcast court call.");
      }
    });
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(messageText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setError("Unable to copy to clipboard.");
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-2 font-display text-xs font-semibold tracking-[0.14em] uppercase transition-all ${
          calledCourt !== null
            ? "border-amber-400/50 bg-amber-400/10 text-amber-300 hover:bg-amber-400/20"
            : "border-off-white/20 bg-off-white/5 text-off-white hover:border-court-green/40 hover:text-court-green"
        }`}
        title="Call players to court and alert via WhatsApp"
      >
        <Megaphone className="size-3.5" />
        <span>{calledCourt !== null ? `Called (C${calledCourt})` : "Call Court"}</span>
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div
            className="w-full max-w-md rounded-2xl border border-off-white/15 bg-black/95 p-6 shadow-2xl space-y-5"
            role="dialog"
            aria-modal="true"
            aria-labelledby="court-call-title"
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-off-white/10 pb-3">
              <div className="flex items-center gap-2">
                <span className="flex size-7 items-center justify-center rounded-lg bg-court-green/20 text-court-green">
                  <Megaphone className="size-4" />
                </span>
                <h3 id="court-call-title" className="font-display text-base font-bold text-off-white uppercase tracking-wider">
                  Call Match To Court
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="rounded-lg p-1 text-muted hover:bg-off-white/10 hover:text-off-white"
                aria-label="Close dialog"
              >
                <X className="size-4" />
              </button>
            </div>

            {/* Match Summary */}
            <div className="rounded-xl border border-off-white/10 bg-off-white/[0.03] p-3 text-xs space-y-1">
              <div className="text-muted font-medium">
                {match.event} · {match.round}
              </div>
              <div className="font-display text-sm font-bold text-off-white">
                {sideA} <span className="font-normal text-muted">vs</span> {sideB}
              </div>
            </div>

            {/* Court Selector */}
            <div className="space-y-2">
              <label htmlFor="court-select" className="block text-xs font-semibold text-muted uppercase tracking-wider">
                Select Court
              </label>
              <div className="grid grid-cols-4 gap-2">
                {Array.from({ length: Math.max(4, courtsCount) }, (_, i) => i + 1).map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setSelectedCourt(c)}
                    className={`rounded-xl py-2.5 font-display text-sm font-bold uppercase transition-all ${
                      selectedCourt === c
                        ? "bg-court-green text-black shadow-[0_0_12px_rgba(16,185,129,0.4)]"
                        : "border border-off-white/10 bg-off-white/5 text-off-white hover:bg-off-white/10"
                    }`}
                  >
                    Court {c}
                  </button>
                ))}
              </div>
            </div>

            {/* Broadcast Action */}
            <div className="space-y-2">
              <button
                type="button"
                disabled={pending}
                onClick={handleCall}
                className="w-full rounded-xl bg-court-green py-3 font-display text-xs font-bold tracking-[0.16em] text-black uppercase transition-all hover:bg-off-white hover:scale-[1.01] disabled:opacity-60 shadow-[0_0_15px_rgba(16,185,129,0.3)]"
              >
                {pending ? "Broadcasting…" : `🔔 Broadcast Call to Court ${selectedCourt}`}
              </button>

              {calledCourt && (
                <p className="text-center font-display text-xs font-semibold text-court-green animate-in fade-in">
                  ✓ Arena announcement live: Court {calledCourt} active on scoreboard banner!
                </p>
              )}

              {error && (
                <p role="alert" className="text-center text-xs text-rose-400">
                  {error}
                </p>
              )}
            </div>

            {/* WhatsApp 1-Tap Notification Section */}
            <div className="border-t border-off-white/10 pt-4 space-y-3">
              <span className="block text-xs font-semibold text-muted uppercase tracking-wider">
                1-Tap WhatsApp Alerts
              </span>

              <div className="flex gap-2">
                <a
                  href={waShareUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[#25D366] px-4 py-2.5 font-display text-xs font-bold tracking-[0.12em] text-black uppercase hover:bg-[#20ba59] transition-all shadow-[0_0_15px_rgba(37,211,102,0.3)]"
                >
                  <Share2 className="size-4" />
                  <span>Share on WhatsApp</span>
                  <ExternalLink className="size-3 opacity-70" />
                </a>

                <button
                  type="button"
                  onClick={copyToClipboard}
                  className="inline-flex min-h-11 items-center justify-center gap-1.5 rounded-xl border border-off-white/15 px-3 py-2 text-xs font-semibold text-off-white hover:bg-off-white/10 transition-colors"
                  title="Copy call message to clipboard"
                >
                  {copied ? <Check className="size-4 text-court-green" /> : <Copy className="size-4" />}
                  <span>{copied ? "Copied" : "Copy"}</span>
                </button>
              </div>

              {/* Message preview snippet */}
              <div className="rounded-lg bg-black/60 p-2.5 border border-off-white/5 text-[11px] text-muted font-mono leading-relaxed whitespace-pre-line max-h-24 overflow-y-auto">
                {messageText}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
