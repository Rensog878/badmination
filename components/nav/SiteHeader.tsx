"use client";

import { useCallback, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import MobileMenu from "@/components/nav/MobileMenu";
import { useActiveSection, useHeaderState } from "@/components/nav/useHeaderState";
import { COACH_NAME, NAV_CTA, VISIBLE_NAV_LINKS } from "@/lib/content";

const MENU_ID = "mobile-menu";
const NAV_HREFS = VISIBLE_NAV_LINKS.map((l) => l.href);
/** With a single destination a menu is just an extra tap: phones get the Register button instead. */
const needsMenu = VISIBLE_NAV_LINKS.length > 1;

/**
 * Fixed site header. Transparent over the hero, gains a backing once the page
 * scrolls, and slides away while scrolling down so the cinematic sequence stays clear.
 */
export default function SiteHeader() {
  const [menuOpen, setMenuOpen] = useState(false);
  const { solid, hidden } = useHeaderState(menuOpen);
  const active = useActiveSection(NAV_HREFS);
  const closeMenu = useCallback(() => setMenuOpen(false), []);
  const pathname = usePathname();

  // Staff areas (admin, umpire console) have their own compact headers.
  if (pathname.startsWith("/admin") || pathname.startsWith("/umpire")) return null;
  // Transparent only over the dark 3D hero; other pages are daylight pages with a matching light bar.
  const backed = solid || pathname !== "/";

  return (
    <>
      <header
        className={`${pathname === "/" ? "" : "theme-light"} fixed inset-x-0 top-0 z-50 pt-[env(safe-area-inset-top)] pr-[env(safe-area-inset-right)] pl-[env(safe-area-inset-left)] print:hidden transition-[transform,background-color,border-color] duration-500 ease-out motion-reduce:transition-none ${
          hidden ? "-translate-y-full" : "translate-y-0"
        } ${backed && !menuOpen ? "border-b border-off-white/10 bg-charcoal/85 backdrop-blur-xl shadow-[0_4px_30px_rgba(0,0,0,0.4)]" : "border-b border-transparent"}`}
      >
        <div className="mx-auto flex h-16 max-w-[1600px] items-center justify-between px-4 sm:px-8 lg:h-20 lg:px-16">
          <Link href="/" className="group flex items-center gap-2 font-display text-sm font-black tracking-[0.18em] uppercase transition-transform duration-200 active:scale-95" onClick={closeMenu}>
            <span>{COACH_NAME}</span>
            <span aria-hidden="true" className="size-2 rounded-full bg-court-green shadow-[0_0_8px_rgba(16,185,129,0.9)] animate-pulse" />
          </Link>

          <nav aria-label="Primary" className="hidden lg:block">
            <ul className="flex items-center gap-10">
              {VISIBLE_NAV_LINKS.map((link) => {
                const current = active === link.href;
                return (
                  <li key={link.href}>
                    <a
                      href={link.href}
                      aria-current={current ? "true" : undefined}
                      className={`relative py-2 font-display text-xs font-semibold tracking-[0.16em] uppercase transition-colors hover:text-off-white ${
                        current ? "text-off-white" : "text-muted"
                      } after:absolute after:inset-x-0 after:-bottom-0.5 after:h-0.5 after:origin-left after:bg-court-green after:shadow-[0_0_8px_rgba(16,185,129,0.8)] after:transition-transform after:duration-300 hover:after:scale-x-100 ${
                        current ? "after:scale-x-100" : "after:scale-x-0"
                      }`}
                    >
                      {link.label}
                    </a>
                  </li>
                );
              })}
            </ul>
          </nav>

          <div className="flex items-center gap-3">
            <a
              href={NAV_CTA.href}
              className={`${needsMenu ? "hidden sm:inline-flex" : "inline-flex"} min-h-11 items-center rounded-xl border border-court-green/50 bg-court-green/10 px-5 py-2.5 font-display text-xs font-bold tracking-[0.2em] text-court-green uppercase shadow-[0_0_15px_rgba(16,185,129,0.15)] transition-all duration-300 hover:border-court-green hover:bg-court-green hover:text-black hover:shadow-[0_0_25px_rgba(16,185,129,0.4)] active:scale-95 motion-reduce:active:scale-100`}
            >
              {NAV_CTA.label}
            </a>
            {needsMenu && (
            <button
              type="button"
              aria-expanded={menuOpen}
              aria-controls={MENU_ID}
              aria-label={menuOpen ? "Close menu" : "Open menu"}
              onClick={() => setMenuOpen((o) => !o)}
              className="-mr-2 inline-flex size-11 items-center justify-center text-off-white lg:hidden"
            >
              {menuOpen ? <X aria-hidden="true" className="size-6" /> : <Menu aria-hidden="true" className="size-6" />}
            </button>
            )}
          </div>
        </div>
      </header>
      {needsMenu && <MobileMenu id={MENU_ID} open={menuOpen} onClose={closeMenu} />}
    </>
  );
}
