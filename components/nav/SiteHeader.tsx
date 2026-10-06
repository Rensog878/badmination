"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import MobileMenu from "@/components/nav/MobileMenu";
import { useActiveSection, useHeaderState } from "@/components/nav/useHeaderState";
import { COACH_NAME } from "@/lib/content";
import { useStudioSettings, DEFAULT_NAV_ITEMS, type NavigationItem } from "@/lib/settings";

const MENU_ID = "mobile-menu";

/**
 * Fixed site header. Transparent over the hero, gains a backing once the page
 * scrolls, and slides away while scrolling down so the cinematic sequence stays clear.
 * Dynamically governed by admin settings for navigation items and CTA buttons.
 */
export default function SiteHeader() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const { settings } = useStudioSettings();
  const { solid, hidden } = useHeaderState(menuOpen);
  const closeMenu = useCallback(() => setMenuOpen(false), []);
  const pathname = usePathname();

  useEffect(() => {
    setMounted(true);
  }, []);

  // Use dynamic nav items when mounted; fallback to defaults during SSR
  const activeNavItems: NavigationItem[] = mounted
    ? settings.navigationItems.filter((item) => item.enabled)
    : DEFAULT_NAV_ITEMS.filter((item) => item.enabled);

  const ctaLabel = mounted ? settings.ctaLabel : "Register";
  const ctaHref = mounted ? settings.ctaHref : "/#tournaments";
  const ctaEnabled = mounted ? settings.ctaEnabled : true;

  const navHrefs = activeNavItems.map((l) => l.href);
  const active = useActiveSection(navHrefs);

  // Distinguish dark pages from daylight tournament pages
  const isDarkPage = pathname === "/" || pathname === "/live" || pathname.includes("/live");
  const isRegisterPage = pathname.endsWith("/register");
  const backed = solid || pathname !== "/";

  // Dynamic status bar and browser toolbar tint matching active page palette
  useEffect(() => {
    const metaThemeColor = document.querySelector('meta[name="theme-color"]');
    if (metaThemeColor) {
      metaThemeColor.setAttribute("content", isDarkPage ? "#0A0A0A" : "#F4F6F9");
    }
  }, [isDarkPage]);

  // Staff areas (admin, umpire console) have their own compact headers.
  if (pathname.startsWith("/admin") || pathname.startsWith("/umpire")) return null;

  return (
    <>
      <header
        className={`${isDarkPage ? "" : "theme-light"} fixed inset-x-0 top-0 z-50 pt-[env(safe-area-inset-top)] pr-[env(safe-area-inset-right)] pl-[env(safe-area-inset-left)] print:hidden transition-[transform,background-color,border-color,box-shadow] duration-500 ease-out motion-reduce:transition-none ${
          hidden ? "-translate-y-full" : "translate-y-0"
        } ${backed && !menuOpen ? "border-b border-white/[0.08] bg-charcoal/85 backdrop-blur-2xl shadow-[0_8px_32px_rgba(0,0,0,0.5)]" : "border-b border-transparent"}`}
      >
        <div className="mx-auto flex h-16 max-w-[1600px] items-center justify-between px-4 sm:px-8 lg:h-20 lg:px-16">
          <Link href="/" className="group flex items-center gap-2.5 font-display text-sm font-black tracking-[0.18em] uppercase transition-transform duration-200 active:scale-95" onClick={closeMenu}>
            <span className="bg-gradient-to-r from-off-white via-white to-off-white/80 bg-clip-text text-transparent group-hover:to-court-green transition-all">
              {COACH_NAME}
            </span>
            <span className="hidden xs:inline-flex items-center rounded-md border border-court-green/30 bg-court-green/10 px-1.5 py-0.5 text-[9px] font-bold tracking-widest text-court-green uppercase shadow-[0_0_10px_rgba(16,185,129,0.2)]">
              Arena
            </span>
            <span aria-hidden="true" className="relative flex size-2.5 items-center justify-center">
              <span className="absolute inline-flex size-full animate-ping rounded-full bg-court-green opacity-75 motion-reduce:hidden" />
              <span className="relative inline-flex size-2 rounded-full bg-court-green shadow-[0_0_8px_rgba(16,185,129,0.95)]" />
            </span>
          </Link>

          <nav aria-label="Primary" className="hidden lg:block">
            <ul className="flex items-center gap-7 xl:gap-9">
              {activeNavItems.map((link) => {
                const current = active === link.href || (link.href !== "/" && pathname === link.href);
                const isLiveLink = link.label.toLowerCase().includes("live");

                return (
                  <li key={link.id || link.href}>
                    <a
                      href={link.href}
                      aria-current={current ? "true" : undefined}
                      className={`relative flex items-center gap-1.5 py-2 font-display text-xs font-semibold tracking-[0.16em] uppercase transition-colors hover:text-off-white ${
                        current ? "text-off-white" : "text-muted"
                      } after:absolute after:inset-x-0 after:-bottom-0.5 after:h-0.5 after:origin-left after:bg-court-green after:shadow-[0_0_8px_rgba(16,185,129,0.8)] after:transition-transform after:duration-300 hover:after:scale-x-100 ${
                        current ? "after:scale-x-100" : "after:scale-x-0"
                      }`}
                    >
                      {isLiveLink && (
                        <span className="relative flex size-1.5 shrink-0">
                          <span className="absolute inline-flex size-full animate-ping rounded-full bg-court-green opacity-75" />
                          <span className="relative size-1.5 rounded-full bg-court-green shadow-[0_0_6px_rgba(16,185,129,0.9)]" />
                        </span>
                      )}
                      <span>{link.label}</span>
                    </a>
                  </li>
                );
              })}
            </ul>
          </nav>

          <div className="flex items-center gap-3">
            {!isRegisterPage && ctaEnabled && (
              <a
                href={ctaHref}
                className="btn-shimmer hidden sm:inline-flex min-h-11 items-center rounded-xl border border-court-green/50 bg-court-green/10 px-5 py-2.5 font-display text-xs font-bold tracking-[0.2em] text-court-green uppercase shadow-[0_0_20px_rgba(16,185,129,0.25)] transition-all duration-300 hover:border-court-green hover:bg-court-green hover:text-black hover:shadow-[0_0_30px_rgba(16,185,129,0.5)] active:scale-95 motion-reduce:active:scale-100"
              >
                {ctaLabel}
              </a>
            )}
            <button
              type="button"
              aria-expanded={menuOpen}
              aria-controls={MENU_ID}
              aria-label={menuOpen ? "Close menu" : "Open menu"}
              onClick={() => setMenuOpen((o) => !o)}
              className="-mr-2 inline-flex size-11 items-center justify-center rounded-lg text-off-white hover:bg-off-white/10 lg:hidden"
            >
              {menuOpen ? <X aria-hidden="true" className="size-6" /> : <Menu aria-hidden="true" className="size-6" />}
            </button>
          </div>
        </div>
      </header>
      <MobileMenu
        id={MENU_ID}
        open={menuOpen}
        onClose={closeMenu}
        items={activeNavItems}
        cta={{ label: ctaLabel, href: ctaHref, enabled: ctaEnabled }}
      />
    </>
  );
}
