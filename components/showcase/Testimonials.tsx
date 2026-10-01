"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, Quote } from "lucide-react";
import type { Testimonial } from "@/lib/showcase";

/** Scroll-snap rail of quotes with prev/next controls (native scrolling, swipe and keyboard work too). */
export default function Testimonials({ items }: { items: Testimonial[] }) {
  const rail = useRef<HTMLUListElement>(null);
  const [edges, setEdges] = useState({ start: true, end: false });

  const measure = useCallback(() => {
    const el = rail.current;
    if (!el) return;
    setEdges({ start: el.scrollLeft <= 4, end: el.scrollLeft + el.clientWidth >= el.scrollWidth - 4 });
  }, []);

  useEffect(() => {
    measure();
    const el = rail.current;
    el?.addEventListener("scroll", measure, { passive: true });
    window.addEventListener("resize", measure);
    return () => {
      el?.removeEventListener("scroll", measure);
      window.removeEventListener("resize", measure);
    };
  }, [measure]);

  const scrollBy = (dir: 1 | -1) => {
    const el = rail.current;
    const card = el?.querySelector("li");
    if (!el || !card) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    el.scrollBy({ left: dir * (card.getBoundingClientRect().width + 16), behavior: reduce ? "auto" : "smooth" });
  };

  return (
    <div>
      <div className="flex justify-end gap-2">
        <button type="button" onClick={() => scrollBy(-1)} disabled={edges.start} aria-label="Previous testimonials" className="inline-flex size-11 items-center justify-center border border-off-white/20 hover:border-court-green disabled:opacity-30">
          <ChevronLeft aria-hidden="true" className="size-5" />
        </button>
        <button type="button" onClick={() => scrollBy(1)} disabled={edges.end} aria-label="Next testimonials" className="inline-flex size-11 items-center justify-center border border-off-white/20 hover:border-court-green disabled:opacity-30">
          <ChevronRight aria-hidden="true" className="size-5" />
        </button>
      </div>
      <ul
        ref={rail}
        tabIndex={0}
        aria-label="Testimonials"
        className="mt-6 flex snap-x snap-mandatory gap-4 overflow-x-auto pb-4 [scrollbar-width:thin] focus-visible:outline-2"
      >
        {items.map((t) => (
          <li key={t.quote} className="w-[85%] shrink-0 snap-start sm:w-[calc(50%-0.5rem)] lg:w-[calc(33.333%-0.7rem)]">
            <figure className="flex h-full flex-col border border-off-white/10 bg-black/40 p-7">
              <div className="flex items-start justify-between gap-4">
                <Quote aria-hidden="true" className="size-8 text-court-green" />
                {t.placeholder && (
                  <span className="border border-off-white/20 px-2 py-1 font-display text-[0.6rem] tracking-[0.2em] text-muted uppercase">
                    Sample
                  </span>
                )}
              </div>
              <blockquote className="mt-6 flex-1 text-lg leading-relaxed">“{t.quote}”</blockquote>
              <figcaption className="mt-8 border-t border-off-white/10 pt-5">
                <span className="block font-display text-sm font-semibold tracking-[0.1em] uppercase">{t.attribution}</span>
                {t.context && <span className="text-sm text-muted">{t.context}</span>}
              </figcaption>
            </figure>
          </li>
        ))}
      </ul>
    </div>
  );
}
