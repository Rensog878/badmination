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
          scrollTrigger: { trigger: root.current, start: "top bottom", end: "bottom bottom", scrub: SCRUB_SMOOTHING },
        });
        tl.to(smash, { progress: 1, duration: 1 }, 0);
        tl.fromTo(chapter.current, { opacity: 0, y: 12 }, { opacity: 1, y: 0, duration: 0.04 }, CHAPTER_IN);
        tl.to(chapter.current, { opacity: 0, duration: 0.04 }, CHAPTER_OUT);
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

        <div
          ref={flash}
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_55%_35%,rgba(243,244,246,0.9),rgba(16,185,129,0.25)_16%,transparent_42%)] opacity-0"
        />

        <p
          ref={chapter}
          className="absolute top-8 left-4 font-display text-[0.7rem] font-medium tracking-[0.35em] text-court-green uppercase opacity-0 sm:left-8 lg:left-16"
        >
          {SMASH.chapter}
        </p>

        <div className="relative mt-auto flex flex-col items-center px-4 pb-[8vh] text-center">
          <h2
            ref={headline}
            id="smash-heading"
            className="font-display text-[clamp(3.25rem,13vw,11rem)] leading-[0.85] font-bold tracking-[-0.02em] uppercase will-change-transform"
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
