"use client";

import { useState } from "react";
import { ArrowRight, ChevronDown, Sliders, X } from "lucide-react";
import HeroFallback from "@/components/hero/HeroFallback";
import { useStage } from "@/components/stage/StageContext";
import { COACH_NAME, HERO } from "@/lib/content";
import { FEATURES } from "@/lib/features";

/** Hero content. The Cinematic Stage behind it lives in CinematicStage. */
export default function HeroSection() {
  const { mode } = useStage();
  const [specsOpen, setSpecsOpen] = useState(false);

  return (
    <section aria-labelledby="hero-heading" className="relative isolate flex min-h-[600px] h-svh flex-col">
      {mode === "fallback" && <HeroFallback />}

      {/* Legibility scrims: left on desktop, bottom on mobile/tablet. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 bottom-0 h-[62%] bg-linear-to-t from-charcoal via-charcoal/75 to-transparent lg:inset-y-0 lg:left-0 lg:right-auto lg:h-full lg:w-[62%] lg:bg-linear-to-r lg:via-charcoal/55"
      />

      <div className="relative mx-auto flex w-full max-w-[1600px] flex-1 flex-col justify-end px-4 pt-36 pb-14 sm:px-8 sm:pt-40 md:pb-20 lg:justify-center lg:px-16 lg:pt-36 lg:pb-10">
        <div className="max-w-xl lg:max-w-2xl">
          <div className="mb-6 inline-flex items-center gap-2.5 rounded-full border border-court-green/25 bg-court-green/10 px-4 py-1.5 font-display text-xs font-semibold tracking-[0.18em] text-court-green uppercase backdrop-blur-md shadow-[0_0_15px_rgba(16,185,129,0.12)]">
            <span aria-hidden="true" className="size-1.5 rounded-full bg-court-green shadow-[0_0_6px_rgba(16,185,129,0.8)]" />
            <span>{HERO.eyebrow}</span>
            <span aria-hidden="true" className="text-off-white/30">·</span>
            <span className="text-off-white/80">{COACH_NAME}</span>
          </div>

          <h1
            id="hero-heading"
            className="font-display text-[clamp(2.75rem,8vw,6.75rem)] leading-[0.9] font-black tracking-[-0.035em] uppercase text-off-white"
          >
            {HERO.headline}
          </h1>

          <p className="mt-6 max-w-md text-base leading-relaxed text-muted sm:text-lg">{HERO.subline}</p>

          <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:gap-3 md:gap-4">
            <a
              href={HERO.primaryCta.href}
              className="group relative inline-flex w-full items-center justify-center gap-3 rounded-xl bg-court-green px-8 py-4 font-display text-sm font-bold tracking-[0.14em] text-black uppercase shadow-[0_0_25px_rgba(16,185,129,0.3)] transition-all duration-300 hover:scale-[1.02] hover:bg-off-white hover:shadow-[0_0_35px_rgba(243,244,246,0.35)] active:scale-[0.98] sm:w-auto"
            >
              {HERO.primaryCta.label}
              <ArrowRight
                aria-hidden="true"
                className="size-4 transition-transform group-hover:translate-x-1.5 motion-reduce:transition-none"
              />
            </a>

            <button
              type="button"
              onClick={() => setSpecsOpen(true)}
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-white/20 bg-white/[0.04] px-6 py-4 font-display text-sm font-bold tracking-[0.14em] text-off-white uppercase backdrop-blur-md transition-all duration-300 hover:border-court-green hover:bg-court-green/10 hover:text-court-green active:scale-95 sm:w-auto"
            >
              <Sliders className="size-4 text-court-green" />
              <span>Pro Specs</span>
            </button>

            {FEATURES.programs && (
            <a
              href={HERO.secondaryCta.href}
              className="inline-flex w-full items-center justify-center rounded-xl border border-off-white/20 bg-white/[0.03] px-8 py-4 font-display text-sm font-bold tracking-[0.14em] text-off-white uppercase backdrop-blur-sm transition-all duration-300 hover:border-court-green hover:bg-court-green/10 hover:text-court-green sm:w-auto"
            >
              {HERO.secondaryCta.label}
            </a>
            )}
          </div>
        </div>
      </div>

      {/* Interactive Racket Specs Modal */}
      {specsOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="specs-title"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-md animate-fade-in"
          onClick={() => setSpecsOpen(false)}
        >
          <div
            className="relative w-full max-w-lg rounded-2xl border border-white/15 bg-black/90 p-6 shadow-2xl backdrop-blur-2xl sm:p-8"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div className="flex items-center gap-2">
                <span className="size-2 rounded-full bg-court-green shadow-[0_0_8px_rgba(16,185,129,0.9)] animate-pulse" />
                <h3 id="specs-title" className="font-display text-base font-extrabold tracking-[0.16em] uppercase text-off-white">
                  Championship Racket Spec
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSpecsOpen(false)}
                className="rounded-lg p-1 text-muted hover:bg-white/10 hover:text-off-white"
                aria-label="Close specifications"
              >
                <X className="size-5" />
              </button>
            </div>

            <div className="mt-6 grid grid-cols-2 gap-4 text-left">
              <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
                <p className="font-display text-[10px] font-bold tracking-[0.18em] text-muted uppercase">BALANCE POINT</p>
                <p className="mt-1 font-display text-2xl font-black text-court-green tabular-nums">305 mm</p>
                <p className="mt-0.5 text-xs text-muted">Head-Heavy Smash Attack</p>
              </div>

              <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
                <p className="font-display text-[10px] font-bold tracking-[0.18em] text-muted uppercase">STRING TENSION</p>
                <p className="mt-1 font-display text-2xl font-black text-off-white tabular-nums">30 LBS</p>
                <p className="mt-0.5 text-xs text-muted">Pro Competition Stringing</p>
              </div>

              <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
                <p className="font-display text-[10px] font-bold tracking-[0.18em] text-muted uppercase">FRAME STRUCTURE</p>
                <p className="mt-1 font-display text-lg font-bold text-off-white">Aero-Hex Box</p>
                <p className="mt-0.5 text-xs text-muted">Ultra High Modulus Carbon</p>
              </div>

              <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
                <p className="font-display text-[10px] font-bold tracking-[0.18em] text-muted uppercase">WEIGHT / GRIP</p>
                <p className="mt-1 font-display text-lg font-bold text-off-white">3U (88g) · G5</p>
                <p className="mt-0.5 text-xs text-muted">Aero Dynamic Precision</p>
              </div>
            </div>

            <div className="mt-6 flex items-center justify-between rounded-xl border border-court-green/30 bg-court-green/10 p-3.5">
              <div className="flex items-center gap-2">
                <span className="size-2 rounded-full bg-court-green shadow-[0_0_8px_rgba(16,185,129,0.9)] animate-pulse" />
                <span className="font-display text-xs font-bold tracking-[0.12em] text-court-green uppercase">
                  Interactive 3D Stage Active
                </span>
              </div>
              <span className="font-mono text-[10px] text-muted">Drag to Rotate in Canvas</span>
            </div>
          </div>
        </div>
      )}

      {/* Scroll cue: phones get a compact animated chevron below the CTAs; desktop the labelled line. */}
      <div aria-hidden="true" className="pointer-events-none absolute bottom-4 left-1/2 -translate-x-1/2 lg:hidden">
        <ChevronDown className="size-6 animate-bounce text-court-green motion-reduce:animate-none" />
      </div>
      <div
        aria-hidden="true"
        className="pointer-events-none absolute bottom-7 left-1/2 hidden -translate-x-1/2 flex-col items-center gap-2.5 lg:flex"
      >
        <span className="font-display text-[11px] font-semibold tracking-[0.22em] text-muted/80 uppercase">Scroll to explore</span>
        <span className="h-10 w-px bg-linear-to-b from-court-green to-transparent" />
      </div>
    </section>
  );
}
