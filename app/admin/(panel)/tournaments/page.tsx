import Link from "next/link";
import { importSamplesAction } from "@/app/admin/actions";
import StatusBadge from "@/components/tournaments/StatusBadge";
import { listTournaments } from "@/lib/data/tournaments";
import { formatInr, formatRange, getStatus } from "@/lib/tournaments";

type PageProps = { searchParams: Promise<{ saved?: string }> };

export default async function AdminTournaments({ searchParams }: PageProps) {
  const { saved } = await searchParams;
  const tournaments = await listTournaments();
  const now = Date.now();

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <h1 className="font-display text-4xl font-bold tracking-[-0.02em] uppercase">Tournaments</h1>
        <Link href="/admin/tournaments/new" className="bg-court-green px-5 py-3 font-display text-xs font-semibold tracking-[0.18em] text-black uppercase hover:bg-off-white">
          New tournament
        </Link>
      </div>
      {saved && (
        <p role="status" className="mt-6 border border-court-green/50 px-4 py-3 text-sm">
          Saved <span className="font-semibold">{saved}</span>. The public pages update immediately.
        </p>
      )}
      {tournaments.length === 0 ? (
        <form action={importSamplesAction} className="mt-8 border border-dashed border-off-white/20 p-6">
          <p className="text-muted">No tournaments in the database.</p>
          <button type="submit" className="mt-4 border border-court-green px-4 py-2 font-display text-xs font-semibold tracking-[0.18em] text-court-green uppercase hover:bg-court-green hover:text-black">
            Import the 6 sample tournaments
          </button>
        </form>
      ) : (
        <div className="mt-8 overflow-x-auto">
          <table className="w-full min-w-[44rem] text-left text-sm">
            <thead className="font-display text-[0.65rem] tracking-[0.2em] text-muted uppercase">
              <tr className="border-b border-off-white/10">
                <th scope="col" className="py-3 pr-4 font-medium">Tournament</th>
                <th scope="col" className="py-3 pr-4 font-medium">Dates</th>
                <th scope="col" className="py-3 pr-4 font-medium">Fee</th>
                <th scope="col" className="py-3 pr-4 font-medium">Entries</th>
                <th scope="col" className="py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {tournaments.map((t) => (
                <tr key={t.slug} className="border-b border-off-white/10">
                  <th scope="row" className="py-4 pr-4 font-normal">
                    <Link href={`/admin/tournaments/${t.slug}`} className="font-semibold text-off-white hover:text-court-green">
                      {t.name}
                    </Link>
                    <span className="block text-xs text-muted">{t.level} · {t.city}</span>
                  </th>
                  <td className="py-4 pr-4">{formatRange(t.startDate, t.endDate)}</td>
                  <td className="py-4 pr-4">{formatInr(t.entryFee)}</td>
                  <td className="py-4 pr-4 tabular-nums">{t.registered} / {t.capacity}</td>
                  <td className="py-4"><StatusBadge tournament={t} status={getStatus(t, now)} now={now} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
