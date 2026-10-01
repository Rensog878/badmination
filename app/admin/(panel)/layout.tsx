import type { Metadata } from "next";
import type { ReactNode } from "react";
import Link from "next/link";
import { adminLogout } from "@/app/admin/actions";
import { requireRole } from "@/lib/auth/session";
import { dbConfigured } from "@/lib/db/mongo";

export const metadata: Metadata = { title: "Admin", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

const NAV = [
  { href: "/admin", label: "Overview" },
  { href: "/admin/tournaments", label: "Tournaments" },
  { href: "/admin/registrations", label: "Registrations" },
  { href: "/admin/live", label: "Live matches" },
  { href: "/admin/media", label: "Gallery & quotes" },
  { href: "/admin/users", label: "Users" },
];

export default async function AdminLayout({ children }: { children: ReactNode }) {
  if (!dbConfigured()) {
    return (
      <main id="main" className="min-h-svh bg-charcoal px-4 pt-32 pb-16 sm:px-8">
        <div className="mx-auto max-w-xl border border-off-white/15 p-8">
          <h1 className="font-display text-3xl font-bold uppercase">Admin needs a database</h1>
          <p className="mt-4 text-muted">Set MONGODB_URI in .env.local (MongoDB Atlas free M0 works), restart, then run:</p>
          <code className="mt-3 block text-sm">npm run admin:create -- you@example.com &quot;Your Name&quot;</code>
        </div>
      </main>
    );
  }
  const user = await requireRole("admin", "/admin");

  return (
    <main id="main" className="min-h-svh bg-charcoal pt-24 lg:pt-28">
      <div className="mx-auto grid max-w-[1600px] gap-8 px-4 pb-20 sm:px-8 lg:grid-cols-[14rem_1fr] lg:px-16">
        <aside className="lg:sticky lg:top-28 lg:self-start">
          <p className="font-display text-xs tracking-[0.32em] text-court-green uppercase">Admin</p>
          <nav aria-label="Admin" className="mt-4">
            <ul className="flex gap-1 overflow-x-auto lg:flex-col">
              {NAV.map((n) => (
                <li key={n.href}>
                  <Link href={n.href} className="block px-3 py-2 text-sm whitespace-nowrap text-muted hover:bg-off-white/5 hover:text-off-white">
                    {n.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
          <div className="mt-6 hidden border-t border-off-white/10 pt-4 text-xs text-muted lg:block">
            <p className="text-off-white">{user.name}</p>
            <p>{user.email}</p>
            <form action={adminLogout} className="mt-3">
              <button type="submit" className="font-display tracking-[0.2em] uppercase hover:text-off-white">
                Sign out
              </button>
            </form>
          </div>
        </aside>
        <div className="min-w-0">{children}</div>
      </div>
    </main>
  );
}
