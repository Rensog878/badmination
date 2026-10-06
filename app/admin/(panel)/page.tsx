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
      <dl className="mt-8 grid grid-cols-2 gap-3.5 lg:grid-cols-5">
        {tiles.map((t) => (
          <Link
            key={t.label}
            href={t.href}
            className="group flex flex-col-reverse rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-md p-5 sm:p-6 transition-all duration-300 hover:border-court-green/40 hover:bg-white/[0.06] hover:shadow-[0_8px_30px_rgba(0,0,0,0.5)] last:col-span-2 lg:last:col-span-1"
          >
            <dt className="mt-2 text-[11px] font-mono tracking-[0.16em] text-muted uppercase transition-colors group-hover:text-off-white">{t.label}</dt>
            <dd className="font-display text-2xl sm:text-3xl font-black tabular-nums text-off-white transition-colors group-hover:text-court-green">{t.value}</dd>
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
