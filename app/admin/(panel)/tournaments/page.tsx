import Link from "next/link";
import { ChevronRight } from "lucide-react";
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
        <Link href="/admin/tournaments/new" className="inline-flex min-h-11 items-center rounded-lg bg-court-green px-5 py-3 font-display text-xs font-semibold tracking-[0.18em] text-black uppercase hover:bg-off-white">
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
          <button type="submit" className="rounded-lg mt-4 border border-court-green px-4 py-2 font-display text-xs font-semibold tracking-[0.18em] text-court-green uppercase hover:bg-court-green hover:text-black">
            Import the 6 sample tournaments
          </button>
        </form>
      ) : (
        <>
        {/* Phones: one tappable card per tournament. */}
        <ul className="mt-6 space-y-3 md:hidden">
          {tournaments.map((t) => (
            <li key={t.slug}>
              <Link href={`/admin/tournaments/${t.slug}`} className="block rounded-2xl border border-off-white/10 bg-black/40 p-4 active:bg-off-white/5">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate font-semibold">{t.name}</p>
                    <p className="text-sm text-muted">
                      {formatRange(t.startDate, t.endDate)} · {t.city}
                    </p>
                  </div>
                  <ChevronRight aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-muted" />
                </div>
                <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-sm">
                  <StatusBadge tournament={t} status={getStatus(t, now)} now={now} />
                  <span className="text-muted tabular-nums">
                    {t.registered}/{t.capacity} · {formatInr(t.entryFee)}
                  </span>
                </div>
              </Link>
            </li>
          ))}
        </ul>
        <div className="mt-8 hidden overflow-x-auto md:block">
          <table className="w-full min-w-[44rem] text-left text-sm">
            <thead className="font-display text-xs tracking-[0.2em] text-muted uppercase">
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
        </>
      )}
    </div>
  );
}
