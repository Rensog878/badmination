"use client";

import { useEffect, useRef, type ReactNode } from "react";

const STAGGER_MS = 80;

interface RevealProps {
  children: ReactNode;
  className?: string;
  /** Animate direct children one after another instead of the wrapper as a whole. */
  stagger?: boolean;
  /** Element to render, so lists keep valid semantics. */
  as?: "div" | "dl" | "ol" | "ul";
}

/**
 * Fades content up once as it enters the viewport. IntersectionObserver + a CSS
 * transition (compositor-only opacity/transform): no animation library, no
 * scroll listeners. Content is fully visible without JS, under reduced motion,
 * and when it is already on screen at load (no flash).
 */
export default function Reveal({ children, className, stagger = false, as: Tag = "div" }: RevealProps) {
  const root = useRef<HTMLElement>(null);

  useEffect(() => {
    const el = root.current;
    if (!el || !("IntersectionObserver" in window)) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    if (el.getBoundingClientRect().top < window.innerHeight) return; // already visible: leave it

    const targets = stagger ? (Array.from(el.children) as HTMLElement[]) : [el];
    targets.forEach((t, i) => {
      t.classList.add("reveal-init");
      if (stagger) t.style.transitionDelay = `${i * STAGGER_MS}ms`;
    });
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        targets.forEach((t) => t.classList.add("reveal-in"));
        observer.disconnect();
      },
      { rootMargin: "0px 0px -8% 0px" },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [stagger]);

  return (
    <Tag ref={(el: HTMLElement | null) => void (root.current = el)} className={className}>
      {children}
    </Tag>
  );
}
