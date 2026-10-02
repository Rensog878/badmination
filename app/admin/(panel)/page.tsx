import Link from "next/link";
import { registrationStats } from "@/lib/data/registrations";
import { listTournaments } from "@/lib/data/tournaments";
import { formatInr, getStatus } from "@/lib/tournaments";

export default async function AdminOverview() {
  const [tournaments, stats] = await Promise.all([listTournaments(), registrationStats()]);
  const now = Date.now();
  const open = tournaments.filter((t) => getStatus(t, now) === "open").length;

  const tiles = [
    { label: "Tournaments", value: String(tournaments.length), href: "/admin/tournaments" },
    { label: "Open for entry", value: String(open), href: "/admin/tournaments" },
    { label: "Paid entries", value: String(stats.paid), href: "/admin/registrations?status=paid" },
    { label: "Awaiting payment", value: String(stats.pending), href: "/admin/registrations?status=pending_payment" },
    { label: "Revenue", value: formatInr(stats.revenue), href: "/admin/registrations?status=paid" },
  ];

  return (
    <div>
      <h1 className="font-display text-4xl font-bold tracking-[-0.02em] uppercase">Overview</h1>
      <dl className="mt-8 grid gap-px overflow-hidden rounded-2xl border border-off-white/10 bg-off-white/10 grid-cols-2 lg:grid-cols-5">
        {tiles.map((t) => (
          <Link
            key={t.label}
            href={t.href}
            className="flex flex-col-reverse bg-charcoal p-5 sm:p-6 transition-colors hover:bg-off-white/[0.04] last:col-span-2 lg:last:col-span-1"
          >
            <dt className="mt-1 text-xs tracking-[0.15em] text-muted uppercase">{t.label}</dt>
            <dd className="font-display text-2xl sm:text-3xl font-bold tabular-nums text-off-white">{t.value}</dd>
          </Link>
        ))}
      </dl>
      {tournaments.length === 0 && (
        <p className="mt-8 text-muted">
          No tournaments yet. <Link href="/admin/tournaments" className="text-court-green underline underline-offset-4">Create one</Link> or import the samples.
        </p>
      )}
    </div>
  );
}
