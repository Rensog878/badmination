import type { Metadata } from "next";
import type { ReactNode } from "react";
import Link from "next/link";
import AdminNav from "@/components/admin/AdminNav";
import { adminLogout } from "@/app/admin/actions";
import { requireRole } from "@/lib/auth/session";
import { COACH_NAME } from "@/lib/content";
import { dbConfigured } from "@/lib/db/mongo";
import { FEATURES } from "@/lib/features";

export const metadata: Metadata = { title: "Admin", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

const NAV = [
  { href: "/admin", label: "Overview" },
  { href: "/admin/tournaments", label: "Tournaments" },
  { href: "/admin/registrations", label: "Registrations" },
  { href: "/admin/live", label: "Live matches" },
  ...(FEATURES.showcase ? [{ href: "/admin/media", label: "Gallery & quotes" }] : []),
  { href: "/admin/users", label: "Users" },
  { href: "/admin/settings", label: "Settings & Flags" },
];

export default async function AdminLayout({ children }: { children: ReactNode }) {
  if (!dbConfigured()) {
    return (
      <main id="main" className="min-h-svh bg-charcoal px-4 pt-16 pb-16 sm:px-8">
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
    <main id="main" className="min-h-svh bg-charcoal">
      {/* Compact admin bar: always shows who is signed in and a way out (phones included). */}
      <header className="sticky top-0 z-40 border-b border-white/10 bg-black/85 backdrop-blur-xl pt-[env(safe-area-inset-top)]">
        <div className="mx-auto flex h-14 max-w-[1600px] items-center justify-between gap-4 px-4 sm:px-8 lg:h-16 lg:px-16">
          <Link href="/admin" className="font-display text-sm font-black tracking-[0.12em] uppercase flex items-center gap-2">
            <span className="bg-gradient-to-r from-off-white via-white to-off-white/80 bg-clip-text text-transparent">{COACH_NAME}</span>
            <span className="rounded-md border border-court-green/40 bg-court-green/15 px-2 py-0.5 text-[10px] font-bold text-court-green tracking-widest shadow-[0_0_8px_rgba(16,185,129,0.3)]">ADMIN</span>
          </Link>
          <div className="flex items-center gap-3">
            <span className="hidden max-w-48 truncate text-xs font-medium text-muted sm:inline">{user.name}</span>
            <Link href="/" className="hidden min-h-11 items-center px-3 text-xs font-semibold uppercase tracking-wider text-muted hover:text-off-white sm:inline-flex transition-colors">
              View site
            </Link>
            <form action={adminLogout}>
              <button
                type="submit"
                className="inline-flex min-h-10 items-center rounded-xl border border-white/15 bg-white/[0.03] px-3.5 text-xs font-bold uppercase tracking-wider text-off-white hover:border-court-green hover:text-court-green hover:bg-white/[0.06] transition-all"
              >
                Sign out
              </button>
            </form>
          </div>
        </div>
      </header>

      <div className="mx-auto grid max-w-[1600px] gap-6 px-4 pt-4 pb-20 sm:px-8 lg:grid-cols-[14rem_1fr] lg:gap-8 lg:px-16 lg:pt-10">
        <aside className="min-w-0 border-b border-off-white/10 pb-3 lg:border-b-0 lg:pb-0 lg:sticky lg:top-24 lg:self-start">
          <AdminNav items={NAV} />
        </aside>
        <div className="min-w-0">{children}</div>
      </div>
    </main>
  );
}
