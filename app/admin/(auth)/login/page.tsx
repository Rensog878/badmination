import type { Metadata } from "next";
import LoginForm from "@/components/admin/LoginForm";
import { safeNext } from "@/lib/admin/guard";
import { dbConfigured } from "@/lib/db/mongo";

export const metadata: Metadata = { title: "Sign in", robots: { index: false, follow: false } };

type PageProps = { searchParams: Promise<{ next?: string; denied?: string }> };

export default async function LoginPage({ searchParams }: PageProps) {
  const { next, denied } = await searchParams;
  return (
    <main id="main" className="flex min-h-svh items-center justify-center bg-charcoal px-4 pt-24 pb-16">
      <div className="w-full max-w-sm">
        <p className="font-display text-xs tracking-[0.32em] text-court-green uppercase">Staff</p>
        <h1 className="mt-3 font-display text-4xl font-bold tracking-[-0.02em] uppercase">Sign in</h1>
        {denied && <p className="mt-4 text-sm text-muted">That area needs an admin account.</p>}
        <div className="mt-8">
          {dbConfigured() ? (
            <LoginForm next={safeNext(next)} />
          ) : (
            <p className="border border-off-white/15 p-5 text-sm text-muted">
              Accounts need the database. Set MONGODB_URI (see .env.example), then create the first admin with
              <code className="mt-2 block text-off-white">npm run admin:create -- you@example.com &quot;Your Name&quot;</code>
            </p>
          )}
        </div>
      </div>
    </main>
  );
}
