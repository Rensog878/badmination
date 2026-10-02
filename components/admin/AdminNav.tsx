"use client";

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

  return (
    <nav aria-label="Admin">
      <ul ref={highlight.ref} className="relative -mx-4 flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none] lg:mx-0 lg:flex-col lg:gap-1 lg:overflow-visible lg:px-0">
        <span
          aria-hidden="true"
          style={highlight.style}
          className="indicator absolute top-0 left-0 rounded-full bg-off-white lg:rounded-lg lg:bg-off-white/10"
        />
        {items.map((n) => {
          const active = isActive(n.href);
          return (
            <li key={n.href} className="shrink-0">
              <Link
                href={n.href}
                data-indicator={n.href}
                aria-current={active ? "page" : undefined}
                className={`relative flex min-h-11 items-center rounded-full border px-4 text-sm whitespace-nowrap transition-colors duration-300 lg:rounded-lg lg:px-3 ${
                  active
                    ? `border-transparent font-semibold text-black lg:text-off-white ${highlight.ready ? "" : "bg-off-white lg:bg-off-white/10"}`
                    : "border-off-white/15 text-muted hover:text-off-white lg:border-transparent lg:hover:bg-off-white/5"
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
