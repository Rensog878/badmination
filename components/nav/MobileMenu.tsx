"use client";

import { useEffect, useRef } from "react";
import { ArrowRight } from "lucide-react";
import { NAV_CTA, NAV_LINKS } from "@/lib/content";

interface MobileMenuProps {
  open: boolean;
  onClose: () => void;
  id: string;
}

const FOCUSABLE = "a[href], button:not([disabled])";

/** Full-screen menu for < lg. Traps focus, closes on Escape, locks page scroll. */
export default function MobileMenu({ open, onClose, id }: MobileMenuProps) {
  const panel = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const root = document.documentElement;
    const previousOverflow = root.style.overflow;
    root.style.overflow = "hidden";
    panel.current?.querySelector<HTMLElement>(FOCUSABLE)?.focus();

    const onKey = (e: KeyboardEvent) => {
      // The toggle lives in the header: it joins the trap and gets focus back on Escape.
      const toggle = document.querySelector<HTMLElement>(`[aria-controls="${id}"]`);
      if (e.key === "Escape") {
        onClose();
        toggle?.focus();
        return;
      }
      if (e.key !== "Tab" || !panel.current) return;
      const items = [
        ...(toggle ? [toggle] : []),
        ...Array.from(panel.current.querySelectorAll<HTMLElement>(FOCUSABLE)),
      ];
      const first = items[0];
      const last = items[items.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => {
      root.style.overflow = previousOverflow;
      document.removeEventListener("keydown", onKey);
    };
  }, [open, onClose, id]);

  return (
    <div
      ref={panel}
      id={id}
      role="dialog"
      aria-modal="true"
      aria-label="Site menu"
      hidden={!open}
      className="fixed inset-0 z-40 flex flex-col bg-charcoal px-4 pt-24 pb-10 sm:px-8 lg:hidden"
    >
      <nav aria-label="Mobile" className="flex-1">
        <ol className="flex flex-col gap-2">
          {NAV_LINKS.map((link, i) => (
            <li key={link.href} className="border-b border-off-white/10">
              <a
                href={link.href}
                onClick={onClose}
                className="flex items-baseline gap-5 py-5 font-display text-[clamp(2.25rem,11vw,4rem)] leading-none font-bold tracking-[-0.02em] uppercase transition-colors hover:text-court-green"
              >
                <span className="font-sans text-xs font-medium tracking-[0.3em] text-court-green">
                  {String(i + 1).padStart(2, "0")}
                </span>
                {link.label}
              </a>
            </li>
          ))}
        </ol>
      </nav>
      <a
        href={NAV_CTA.href}
        onClick={onClose}
        className="inline-flex items-center justify-center gap-3 bg-court-green px-7 py-4 font-display text-sm font-semibold tracking-[0.14em] text-black uppercase"
      >
        {NAV_CTA.label}
        <ArrowRight aria-hidden="true" className="size-4" />
      </a>
    </div>
  );
}
