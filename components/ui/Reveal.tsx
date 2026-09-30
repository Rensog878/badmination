"use client";

import { useRef, type ReactNode } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";

gsap.registerPlugin(ScrollTrigger, useGSAP);

const DISTANCE_PX = 28;
const DURATION_S = 0.9;
const STAGGER_S = 0.08;

interface RevealProps {
  children: ReactNode;
  className?: string;
  /** Animate direct children one after another instead of the wrapper as a whole. */
  stagger?: boolean;
  /** Element to render, so lists keep valid semantics. */
  as?: "div" | "dl" | "ol" | "ul";
}

/**
 * Fades content up once as it enters the viewport. Content is fully visible
 * without JS and under prefers-reduced-motion (no animation is registered).
 */
export default function Reveal({ children, className, stagger = false, as: Tag = "div" }: RevealProps) {
  const root = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const el = root.current;
      if (!el || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
      const targets = stagger ? Array.from(el.children) : el;
      gsap.from(targets, {
        opacity: 0,
        y: DISTANCE_PX,
        duration: DURATION_S,
        ease: "power3.out",
        stagger: stagger ? STAGGER_S : 0,
        scrollTrigger: { trigger: el, start: "top 92%", once: true },
      });
    },
    { scope: root },
  );

  return (
    <Tag ref={(el: HTMLElement | null) => void (root.current = el)} className={className}>
      {children}
    </Tag>
  );
}
