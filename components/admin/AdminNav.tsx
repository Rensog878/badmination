"use client";

import { useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useIndicator } from "@/components/ui/useIndicator";

export interface AdminNavItem {
  href: string;
  label: string;
}

/**
 * Admin navigation. Phones: a swipeable row of 44px pill tabs under the top bar.
 * Desktop: a vertical sidebar list. The current section is highlighted.
 */
export default function AdminNav({ items }: { items: AdminNavItem[] }) {
  const pathname = usePathname();
  const isActive = (href: string) => (href === "/admin" ? pathname === "/admin" : pathname.startsWith(href));
  const activeHref = items.find((n) => isActive(n.href))?.href ?? "";
  const highlight = useIndicator<HTMLUListElement>(activeHref, true);

  useEffect(() => {
    if (!highlight.ref.current) return;
    const activeEl = highlight.ref.current.querySelector('[aria-current="page"]');
    if (activeEl) {
      activeEl.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
    }
  }, [activeHref, highlight.ref]);

  return (
    <nav aria-label="Admin">
      <ul ref={highlight.ref} className="relative -mx-4 flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none] lg:mx-0 lg:flex-col lg:gap-1.5 lg:overflow-visible lg:px-0">
        <span
          aria-hidden="true"
          style={highlight.style}
          className="indicator absolute top-0 left-0 rounded-full bg-court-green/20 border border-court-green/40 shadow-[0_0_12px_rgba(16,185,129,0.3)] lg:rounded-xl"
        />
        {items.map((n) => {
          const active = isActive(n.href);
          return (
            <li key={n.href} className="shrink-0">
              <Link
                href={n.href}
                data-indicator={n.href}
                aria-current={active ? "page" : undefined}
                className={`relative flex min-h-11 items-center rounded-full border px-4 font-display text-xs font-bold tracking-[0.1em] uppercase whitespace-nowrap transition-colors duration-300 lg:rounded-xl lg:px-3.5 ${
                  active
                    ? `border-court-green/40 font-bold text-court-green ${highlight.ready ? "" : "bg-court-green/15"}`
                    : "border-white/10 text-muted hover:text-off-white hover:border-white/25 lg:border-transparent lg:hover:bg-white/[0.04]"
                }`}
              >
                {n.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
