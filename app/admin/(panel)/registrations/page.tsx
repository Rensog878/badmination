import Link from "next/link";
import { listRegistrations, type RegistrationStatus } from "@/lib/data/registrations";
import { listTournaments } from "@/lib/data/tournaments";
import { formatInr } from "@/lib/tournaments";

type PageProps = { searchParams: Promise<{ tournament?: string; status?: string }> };

const STATUSES: { value: RegistrationStatus; label: string }[] = [
  { value: "paid", label: "Paid" },
  { value: "pending_payment", label: "Awaiting payment" },
];

const dateTime = new Intl.DateTimeFormat("en-IN", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Kolkata" });

export default async function AdminRegistrations({ searchParams }: PageProps) {
  const sp = await searchParams;
  const status = STATUSES.find((s) => s.value === sp.status)?.value;
  const [rows, tournaments] = await Promise.all([
    listRegistrations({ tournament: sp.tournament || undefined, status }),
    listTournaments(),
  ]);
  const query = new URLSearchParams({
    ...(sp.tournament ? { tournament: sp.tournament } : {}),
    ...(status ? { status } : {}),
  }).toString();

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <h1 className="font-display text-4xl font-bold tracking-[-0.02em] uppercase">Registrations</h1>
        <a
          href={`/admin/registrations/export${query ? `?${query}` : ""}`}
          className="rounded-lg border border-court-green px-4 py-2.5 font-display text-xs font-semibold tracking-[0.18em] text-court-green uppercase hover:bg-court-green hover:text-black"
        >
          Export CSV
        </a>
      </div>

      <form className="mt-8 flex flex-wrap items-end gap-3">
        <label className="text-sm">
          <span className="mb-1 block text-xs tracking-[0.18em] text-muted uppercase">Tournament</span>
          <select name="tournament" defaultValue={sp.tournament ?? ""} className="border border-off-white/15 bg-charcoal px-3 py-2.5">
            <option value="">All</option>
            {tournaments.map((t) => (
              <option key={t.slug} value={t.slug}>
                {t.name}
              </option>
            ))}
          </select>
        </label>
        <label className="text-sm">
          <span className="mb-1 block text-xs tracking-[0.18em] text-muted uppercase">Status</span>
          <select name="status" defaultValue={status ?? ""} className="border border-off-white/15 bg-charcoal px-3 py-2.5">
            <option value="">All</option>
            {STATUSES.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
        </label>
        <button type="submit" className="rounded-lg bg-off-white px-4 py-2.5 font-display text-xs font-semibold tracking-[0.18em] text-black uppercase">
          Filter
        </button>
        {(sp.tournament || status) && (
          <Link href="/admin/registrations" className="py-2.5 text-sm text-muted underline underline-offset-4">
            Clear
          </Link>
        )}
      </form>

      <p className="mt-6 text-sm text-muted">
        {rows.length} registration{rows.length === 1 ? "" : "s"}
      </p>
      <div className="mt-3 overflow-x-auto">
        <table className="w-full min-w-[56rem] text-left text-sm">
          <thead className="font-display text-xs tracking-[0.2em] text-muted uppercase">
            <tr className="border-b border-off-white/10">
              <th scope="col" className="py-3 pr-4 font-medium">Reference</th>
              <th scope="col" className="py-3 pr-4 font-medium">Player</th>
              <th scope="col" className="py-3 pr-4 font-medium">Tournament · events</th>
              <th scope="col" className="py-3 pr-4 font-medium">Total</th>
              <th scope="col" className="py-3 pr-4 font-medium">Status</th>
              <th scope="col" className="py-3 font-medium">Created</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.reference} className="border-b border-off-white/10 align-top">
                <th scope="row" className="py-3 pr-4 font-display font-semibold">
                  {r.reference}
                </th>
                <td className="py-3 pr-4">
                  {r.player.fullName}
                  <span className="block text-xs text-muted">
                    {r.player.email} · {r.player.phone}
                  </span>
                </td>
                <td className="py-3 pr-4">
                  {r.tournamentName}
                  <span className="block text-xs text-muted">{r.events.join(", ")}</span>
                </td>
                <td className="py-3 pr-4 tabular-nums">{formatInr(r.total)}</td>
                <td
                  className={`py-3 pr-4 font-display text-xs font-semibold tracking-[0.15em] uppercase ${
                    r.status === "paid" ? "text-court-green" : "text-muted"
                  }`}
                >
                  {r.status === "paid" ? "Paid" : "Awaiting payment"}
                </td>
                <td className="py-3 text-muted">{dateTime.format(r.createdAt)}</td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={6} className="py-8 text-center text-muted">
                  No registrations match.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
