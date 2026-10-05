"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowRight, Download } from "lucide-react";
import { DEFAULT_NAV_ITEMS, type NavigationItem } from "@/lib/settings";

interface MobileMenuProps {
  open: boolean;
  onClose: () => void;
  id: string;
  items?: NavigationItem[];
  cta?: { label: string; href: string; enabled: boolean };
}

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: "accepted" | "dismissed";
    platform: string;
  }>;
  prompt(): Promise<void>;
}

const FOCUSABLE = "a[href], button:not([disabled])";

/** Full-screen menu for < lg. Traps focus, closes on Escape, locks page scroll. */
export default function MobileMenu({ open, onClose, id, items, cta }: MobileMenuProps) {
  const panel = useRef<HTMLDivElement>(null);
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isStandalone, setIsStandalone] = useState(false);

  const navItems = items ?? DEFAULT_NAV_ITEMS.filter((i) => i.enabled);
  const ctaConfig = cta ?? { label: "Register", href: "/#tournaments", enabled: true };

  useEffect(() => {
    if (typeof window !== "undefined") {
      const isStandaloneMode =
        window.matchMedia("(display-mode: standalone)").matches ||
        Boolean((window.navigator as unknown as { standalone?: boolean }).standalone);
      setIsStandalone(Boolean(isStandaloneMode));

      const handleBeforeInstall = (e: Event) => {
        e.preventDefault();
        setDeferredPrompt(e as BeforeInstallPromptEvent);
      };
      window.addEventListener("beforeinstallprompt", handleBeforeInstall);
      return () => window.removeEventListener("beforeinstallprompt", handleBeforeInstall);
    }
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const choiceResult = await deferredPrompt.userChoice;
      if (choiceResult.outcome === "accepted") {
        setDeferredPrompt(null);
      }
    } else {
      alert("To install Badmination on your home screen:\n\n1. In Safari/Chrome, tap the Share/Menu button\n2. Tap 'Add to Home Screen'");
    }
  };

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
      className="menu-in fixed inset-0 z-40 flex flex-col bg-charcoal px-4 pt-[calc(6rem+env(safe-area-inset-top))] pb-[calc(2.5rem+env(safe-area-inset-bottom))] sm:px-8 lg:hidden"
    >
      <nav aria-label="Mobile" className="flex-1">
        <ol className="flex flex-col gap-2">
          {navItems.map((link, i) => (
            <li key={link.id || link.href} className="menu-item-in border-b border-off-white/10" style={{ animationDelay: `${60 + i * 50}ms` }}>
              <a
                href={link.href}
                onClick={onClose}
                className="flex items-baseline gap-5 py-5 font-display text-[clamp(2.25rem,11vw,4rem)] leading-none font-bold tracking-[-0.02em] uppercase transition-colors hover:text-court-green"
              >
                <span className="font-sans text-xs font-medium tracking-[0.18em] text-court-green">
                  {String(i + 1).padStart(2, "0")}
                </span>
                {link.label}
              </a>
            </li>
          ))}
        </ol>
      </nav>
      <div className="flex flex-col gap-2.5">
        {ctaConfig.enabled && (
          <a
            href={ctaConfig.href}
            onClick={onClose}
            style={{ animationDelay: `${60 + navItems.length * 50}ms` }}
            className="menu-item-in rounded-xl inline-flex items-center justify-center gap-3 bg-court-green px-7 py-4 font-display text-sm font-semibold tracking-[0.14em] text-black uppercase hover:bg-off-white transition-colors"
          >
            {ctaConfig.label}
            <ArrowRight aria-hidden="true" className="size-4" />
          </a>
        )}

        {!isStandalone && (
          <button
            type="button"
            onClick={handleInstallClick}
            className="menu-item-in rounded-xl inline-flex min-h-11 items-center justify-center gap-2 border border-off-white/15 bg-off-white/5 px-4 py-2.5 font-display text-xs font-semibold tracking-[0.14em] text-off-white uppercase hover:border-court-green/40 hover:text-court-green transition-colors"
          >
            <Download className="size-3.5 text-court-green" />
            <span>Install Stadium App</span>
          </button>
        )}
      </div>
    </div>
  );
}
