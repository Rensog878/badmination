"use client";

import { useEffect, useRef } from "react";
import SmashFallback from "@/components/smash/SmashFallback";
import { useStage } from "@/components/stage/StageContext";
import { SMASH } from "@/lib/content";
import { smashProgress } from "@/lib/smashProgress";
import { REDUCED_MOTION_PROGRESS, SMASH_MARKS } from "@/lib/smashTimeline";

const SCRUB_SMOOTHING = 0.8; // seconds the scene takes to catch up with the scrollbar
const FLASH_PEAK = 0.6;
const FLASH_IN = 0.01; // timeline units (the whole sequence is 1)
const FLASH_OUT = 0.06;
const CHAPTER_IN = 0.26;
const CHAPTER_OUT = 0.6;
const REDUCED_TRIGGER_START = "top 60%";

/**
 * THE SMASH. In 3D mode the section is tall scroll space; GSAP scrubs one
 * progress value (sceneState.smash.progress) that the persistent Canvas turns
 * into the whole sequence, and times the DOM beats (impact flash, COMPETE) on
 * the same scale. GSAP is imported only in 3D mode, so the static experience
 * (low-end phones, no WebGL) never downloads it and has no long scroll.
 */
export default function SmashSection() {
  const { mode, reducedMotion } = useStage();
  const root = useRef<HTMLElement>(null);
  const flash = useRef<HTMLDivElement>(null);
  const chapter = useRef<HTMLParagraphElement>(null);
  const headline = useRef<HTMLHeadingElement>(null);
  const subline = useRef<HTMLParagraphElement>(null);
  const bar = useRef<HTMLDivElement>(null);
  const telemetry = useRef<HTMLDivElement>(null);
  const speedRef = useRef<HTMLSpanElement>(null);
  const cinematic = mode === "3d";

  useEffect(() => {
    if (!cinematic) return;
    const smash = smashProgress;
    let cancelled = false;
    let revert = () => {};

    void (async () => {
      const [{ default: gsap }, { ScrollTrigger }] = await Promise.all([import("gsap"), import("gsap/ScrollTrigger")]);
      if (cancelled) return;
      gsap.registerPlugin(ScrollTrigger);
      const ctx = gsap.context(() => {
        if (reducedMotion) {
          // No scrubbed motion: jump straight to a still frame and show the copy.
          gsap.set([headline.current, subline.current], { opacity: 1 });
          ScrollTrigger.create({
            trigger: root.current,
            start: REDUCED_TRIGGER_START,
            onEnter: () => {
              smash.progress = REDUCED_MOTION_PROGRESS;
            },
            onLeaveBack: () => {
              smash.progress = 0;
            },
          });
          return;
        }

        const tl = gsap.timeline({
          defaults: { ease: "none" },
          scrollTrigger: {
            trigger: root.current,
            start: "top bottom",
            end: "bottom bottom",
            scrub: SCRUB_SMOOTHING,
            // Progress bar & Telemetry HUD update: compositor/DOM-direct, no React re-render.
            onUpdate: (self) => {
              const p = self.progress;
              if (bar.current) bar.current.style.transform = `scaleX(${p})`;
              if (speedRef.current) {
                let speed = 0;
                if (p > 0.22 && p <= 0.65) {
                  const frac = (p - 0.22) / 0.43;
                  speed = Math.round(140 + Math.pow(frac, 1.8) * 277);
                } else if (p > 0.65) {
                  speed = 417;
                }
                speedRef.current.textContent = String(speed);
              }
            },
          },
        });
        tl.to(smash, { progress: 1, duration: 1 }, 0);
        tl.fromTo(chapter.current, { opacity: 0, y: 12 }, { opacity: 1, y: 0, duration: 0.04 }, CHAPTER_IN);
        tl.to(chapter.current, { opacity: 0, duration: 0.04 }, CHAPTER_OUT);
        tl.fromTo(telemetry.current, { opacity: 0, x: 20 }, { opacity: 1, x: 0, duration: 0.04 }, CHAPTER_IN);
        tl.to(telemetry.current, { opacity: 0, x: 20, duration: 0.04 }, SMASH_MARKS.contact + 0.03);
        tl.fromTo(flash.current, { opacity: 0 }, { opacity: FLASH_PEAK, duration: FLASH_IN }, SMASH_MARKS.contact - FLASH_IN);
        tl.to(flash.current, { opacity: 0, duration: FLASH_OUT, ease: "power2.out" }, SMASH_MARKS.contact);
        tl.fromTo(
          headline.current,
          { opacity: 0, scale: 1.35, letterSpacing: "0.18em" },
          { opacity: 1, scale: 1, letterSpacing: "-0.02em", duration: 0.05, ease: "power4.out" },
          SMASH_MARKS.compete,
        );
        tl.fromTo(subline.current, { opacity: 0, y: 16 }, { opacity: 1, y: 0, duration: 0.05 }, SMASH_MARKS.compete + 0.06);
      }, root);
      revert = () => ctx.revert();
    })();

    return () => {
      cancelled = true;
      revert();
      smash.progress = 0;
    };
  }, [cinematic, reducedMotion]);

  return (
    <section
      id="smash"
      ref={root}
      aria-labelledby="smash-heading"
      className={`relative ${mode === "fallback" ? "" : "h-[400vh]"}`}
    >
      <div className={`flex h-svh flex-col overflow-hidden ${mode === "fallback" ? "relative" : "sticky top-0"}`}>
        {mode === "fallback" && <SmashFallback />}

        {/* How far through the intro you are. */}
        {cinematic && (
          <div aria-hidden="true" className="absolute inset-x-0 top-0 z-20 h-1 bg-off-white/10">
            <div ref={bar} className="h-full origin-left scale-x-0 bg-court-green" />
          </div>
        )}

        <div
          ref={flash}
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_55%_35%,rgba(243,244,246,0.9),rgba(16,185,129,0.25)_16%,transparent_42%)] opacity-0"
        />

        <div
          ref={chapter}
          className="absolute top-8 left-4 inline-flex items-center gap-2.5 rounded-full border border-court-green/25 bg-court-green/10 px-4 py-1.5 font-display text-xs font-semibold tracking-[0.18em] text-court-green uppercase backdrop-blur-md shadow-[0_0_15px_rgba(16,185,129,0.12)] opacity-0 sm:left-8 lg:left-16"
        >
          <span aria-hidden="true" className="size-1.5 rounded-full bg-court-green shadow-[0_0_6px_rgba(16,185,129,0.8)]" />
          <span>{SMASH.chapter}</span>
        </div>

        {cinematic && (
          <div
            ref={telemetry}
            className="pointer-events-none absolute right-0 top-20 z-20 flex max-w-[calc(100vw-2rem)] flex-col gap-3 rounded-2xl border border-white/[0.08] bg-black/85 p-3.5 backdrop-blur-xl opacity-0 shadow-2xl sm:right-4 sm:top-24 sm:p-5 lg:right-8"
          >
            <div className="flex items-center gap-2 border-b border-white/10 pb-2">
              <span className="size-2 rounded-full bg-court-green shadow-[0_0_8px_rgba(16,185,129,0.9)] animate-pulse" />
              <span className="font-display text-[11px] font-bold tracking-[0.2em] uppercase text-off-white">SMASH TELEMETRY</span>
              <span className="ml-auto font-mono text-[10px] text-court-green tracking-wider uppercase">
                PV SINDHU · 4K REPLAY
              </span>
            </div>
            <div className="grid grid-cols-2 gap-x-5 gap-y-3 text-left">
              <div>
                <p className="font-display text-[10px] font-medium tracking-[0.16em] uppercase text-muted">SHUTTLE SPEED</p>
                <p className="font-display text-2xl font-black text-off-white sm:text-3xl tabular-nums">
                  <span ref={speedRef}>0</span> <span className="text-xs font-bold text-court-green">KM/H</span>
                </p>
              </div>
              <div>
                <p className="font-display text-[10px] font-medium tracking-[0.16em] uppercase text-muted">IMPACT G-FORCE</p>
                <p className="font-display text-2xl font-black text-off-white sm:text-3xl tabular-nums">
                  18.4 <span className="text-xs font-bold text-court-green">G</span>
                </p>
              </div>
              <div>
                <p className="font-display text-[10px] font-medium tracking-[0.16em] uppercase text-muted">LEAP HEIGHT</p>
                <p className="font-display text-lg font-bold text-off-white sm:text-xl tabular-nums">
                  0.82 <span className="text-xs font-semibold text-muted">M</span>
                </p>
              </div>
              <div>
                <p className="font-display text-[10px] font-medium tracking-[0.16em] uppercase text-muted">STEEP ANGLE</p>
                <p className="font-display text-lg font-bold text-court-green sm:text-xl tabular-nums">
                  -14.8°
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="relative mt-auto flex flex-col items-center px-4 pb-[8vh] text-center">
          <h2
            ref={headline}
            id="smash-heading"
            className="font-display text-[clamp(2.25rem,7.5vw,6.5rem)] leading-[0.9] font-black tracking-[-0.02em] uppercase will-change-transform text-off-white"
          >
            {SMASH.headline}
          </h2>
          <p ref={subline} className="mt-5 max-w-md text-base text-muted sm:text-lg">
            {SMASH.subline}
          </p>
          <p className="sr-only">{SMASH.description}</p>
        </div>
      </div>
    </section>
  );
}
