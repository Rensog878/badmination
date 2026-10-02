"use client";

import { ArrowRight, ChevronDown } from "lucide-react";
import HeroFallback from "@/components/hero/HeroFallback";
import { useStage } from "@/components/stage/StageContext";
import { COACH_NAME, HERO } from "@/lib/content";
import { FEATURES } from "@/lib/features";

/** Hero content. The 3D scene behind it lives in CinematicStage's persistent Canvas. */
export default function HeroSection() {
  const { mode } = useStage();

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

          <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:gap-4">
            <a
              href={HERO.primaryCta.href}
              className="group relative inline-flex items-center justify-center gap-3 rounded-xl bg-court-green px-8 py-4 font-display text-sm font-bold tracking-[0.14em] text-black uppercase shadow-[0_0_25px_rgba(16,185,129,0.3)] transition-all duration-300 hover:scale-[1.02] hover:bg-off-white hover:shadow-[0_0_35px_rgba(243,244,246,0.35)] active:scale-[0.98]"
            >
              {HERO.primaryCta.label}
              <ArrowRight
                aria-hidden="true"
                className="size-4 transition-transform group-hover:translate-x-1.5 motion-reduce:transition-none"
              />
            </a>
            {FEATURES.programs && (
            <a
              href={HERO.secondaryCta.href}
              className="inline-flex items-center justify-center rounded-xl border border-off-white/20 bg-white/[0.03] px-8 py-4 font-display text-sm font-bold tracking-[0.14em] text-off-white uppercase backdrop-blur-sm transition-all duration-300 hover:border-court-green hover:bg-court-green/10 hover:text-court-green"
            >
              {HERO.secondaryCta.label}
            </a>
            )}
          </div>
        </div>
      </div>

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
