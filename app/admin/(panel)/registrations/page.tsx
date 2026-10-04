import Link from "next/link";
import { CheckCircle2, Clock, Search, Users, QrCode, Undo2 } from "lucide-react";
import { listRegistrations, registrationStats, type RegistrationStatus } from "@/lib/data/registrations";
import { listTournaments } from "@/lib/data/tournaments";
import { formatInr } from "@/lib/tournaments";
import { toggleCheckInAction } from "@/app/admin/actions";

type PageProps = {
  searchParams: Promise<{
    tournament?: string;
    status?: string;
    checkin?: string;
    q?: string;
  }>;
};

const STATUSES: { value: RegistrationStatus; label: string }[] = [
  { value: "paid", label: "Paid" },
  { value: "pending_payment", label: "Awaiting payment" },
];

const CHECKIN_FILTERS = [
  { value: "", label: "All Arrivals" },
  { value: "checked_in", label: "Checked In" },
  { value: "pending", label: "Awaiting Check-in" },
];

const dateTime = new Intl.DateTimeFormat("en-IN", {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: "Asia/Kolkata",
});

const timeOnly = new Intl.DateTimeFormat("en-IN", {
  timeStyle: "short",
  timeZone: "Asia/Kolkata",
});

export default async function AdminRegistrations({ searchParams }: PageProps) {
  const sp = await searchParams;
  const status = STATUSES.find((s) => s.value === sp.status)?.value;
  const checkInStatus =
    sp.checkin === "checked_in" || sp.checkin === "pending" ? sp.checkin : undefined;
  const search = sp.q?.trim() || undefined;

  const [rows, tournaments, stats] = await Promise.all([
    listRegistrations({
      tournament: sp.tournament || undefined,
      status,
      checkInStatus,
      search,
    }),
    listTournaments(),
    registrationStats(sp.tournament || undefined),
  ]);

  const query = new URLSearchParams({
    ...(sp.tournament ? { tournament: sp.tournament } : {}),
    ...(status ? { status } : {}),
    ...(checkInStatus ? { checkin: checkInStatus } : {}),
    ...(search ? { q: search } : {}),
  }).toString();

  const arrivalRate = stats.paid > 0 ? Math.round((stats.checkedIn / stats.paid) * 100) : 0;
  const awaitingArrival = Math.max(0, stats.paid - stats.checkedIn);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-court-green/30 bg-court-green/10 px-3 py-0.5 text-xs font-bold tracking-[0.16em] text-court-green uppercase">
            <QrCode className="size-3.5" />
            <span>Tournament Day Operations</span>
          </div>
          <h1 className="mt-2 font-display text-3xl font-black uppercase tracking-tight sm:text-4xl">
            Player Check-in Desk
          </h1>
          <p className="mt-1 text-sm text-muted">
            Manage registrations, verify payments, and handle morning arrival verification.
          </p>
        </div>

        <a
          href={`/admin/registrations/export${query ? `?${query}` : ""}`}
          className="inline-flex min-h-11 items-center rounded-xl border border-court-green px-4 py-2.5 font-display text-xs font-bold tracking-[0.16em] text-court-green uppercase transition-all hover:bg-court-green hover:text-black"
        >
          Export CSV
        </a>
      </div>

      {/* Live Morning Arrival Counter Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Confirmed Entries */}
        <div className="rounded-2xl border border-white/10 bg-black/40 p-4 backdrop-blur-sm">
          <div className="flex items-center justify-between text-muted text-xs font-semibold uppercase tracking-wider">
            <span>Confirmed Paid</span>
            <Users className="size-4 text-off-white" />
          </div>
          <p className="mt-2 font-display text-3xl font-black text-off-white">
            {stats.paid}
          </p>
          <span className="mt-1 block text-xs text-muted">
            {stats.pending} awaiting payment
          </span>
        </div>

        {/* Checked In */}
        <div className="rounded-2xl border border-court-green/30 bg-court-green/[0.06] p-4 backdrop-blur-sm">
          <div className="flex items-center justify-between text-court-green text-xs font-bold uppercase tracking-wider">
            <span>Arrived & Checked In</span>
            <CheckCircle2 className="size-4 text-court-green" />
          </div>
          <p className="mt-2 font-display text-3xl font-black text-court-green">
            {stats.checkedIn}
          </p>
          <div className="mt-2 flex items-center gap-2">
            <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-court-green/20">
              <div
                style={{ width: `${arrivalRate}%` }}
                className="h-full bg-court-green transition-all duration-500"
              />
            </div>
            <span className="font-display text-xs font-bold text-court-green">{arrivalRate}%</span>
          </div>
        </div>

        {/* Awaiting Arrival */}
        <div className="rounded-2xl border border-white/10 bg-black/40 p-4 backdrop-blur-sm">
          <div className="flex items-center justify-between text-muted text-xs font-semibold uppercase tracking-wider">
            <span>Awaiting Arrival</span>
            <Clock className="size-4 text-amber-400" />
          </div>
          <p className="mt-2 font-display text-3xl font-black text-amber-400">
            {awaitingArrival}
          </p>
          <span className="mt-1 block text-xs text-muted">
            Expected at tournament desk
          </span>
        </div>

        {/* Total Fee Revenue */}
        <div className="rounded-2xl border border-white/10 bg-black/40 p-4 backdrop-blur-sm">
          <div className="flex items-center justify-between text-muted text-xs font-semibold uppercase tracking-wider">
            <span>Entry Revenue</span>
            <span className="font-bold text-off-white">INR</span>
          </div>
          <p className="mt-2 font-display text-3xl font-black text-off-white">
            {formatInr(stats.revenue)}
          </p>
          <span className="mt-1 block text-xs text-muted">
            Total verified entry collections
          </span>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <form className="flex flex-wrap items-end gap-3 rounded-2xl border border-white/10 bg-black/50 p-4">
        {/* Instant Search Bar */}
        <div className="flex-1 min-w-[200px]">
          <label className="block text-xs font-bold uppercase tracking-wider text-muted mb-1.5">
            Search Player / Ref / Phone
          </label>
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-muted pointer-events-none" />
            <input
              type="text"
              name="q"
              defaultValue={sp.q ?? ""}
              placeholder="e.g. Arjun, REG-2026-001, 98765..."
              className="min-h-11 w-full rounded-xl border border-white/15 bg-charcoal pl-10 pr-3 text-sm text-off-white placeholder:text-muted/60 focus:border-court-green focus:outline-none"
            />
          </div>
        </div>

        {/* Tournament Selector */}
        <label className="text-sm">
          <span className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-muted">
            Tournament
          </span>
          <select
            name="tournament"
            defaultValue={sp.tournament ?? ""}
            className="min-h-11 rounded-xl border border-white/15 bg-charcoal px-3 py-2 text-sm text-off-white focus:border-court-green focus:outline-none"
          >
            <option value="">All Tournaments</option>
            {tournaments.map((t) => (
              <option key={t.slug} value={t.slug}>
                {t.name}
              </option>
            ))}
          </select>
        </label>

        {/* Check-in Filter */}
        <label className="text-sm">
          <span className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-muted">
            Arrival Status
          </span>
          <select
            name="checkin"
            defaultValue={checkInStatus ?? ""}
            className="min-h-11 rounded-xl border border-white/15 bg-charcoal px-3 py-2 text-sm text-off-white focus:border-court-green focus:outline-none"
          >
            {CHECKIN_FILTERS.map((f) => (
              <option key={f.value} value={f.value}>
                {f.label}
              </option>
            ))}
          </select>
        </label>

        {/* Payment Status Filter */}
        <label className="text-sm">
          <span className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-muted">
            Payment
          </span>
          <select
            name="status"
            defaultValue={status ?? ""}
            className="min-h-11 rounded-xl border border-white/15 bg-charcoal px-3 py-2 text-sm text-off-white focus:border-court-green focus:outline-none"
          >
            <option value="">All Payments</option>
            {STATUSES.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
        </label>

        <button
          type="submit"
          className="min-h-11 rounded-xl bg-court-green px-5 py-2.5 font-display text-xs font-bold tracking-[0.16em] text-black uppercase transition-all hover:bg-off-white"
        >
          Filter
        </button>

        {(sp.tournament || status || checkInStatus || search) && (
          <Link
            href="/admin/registrations"
            className="flex min-h-11 items-center px-2 py-2 text-xs font-semibold text-muted underline underline-offset-4 hover:text-off-white"
          >
            Reset
          </Link>
        )}
      </form>

      {/* Results Count */}
      <div className="flex items-center justify-between text-xs text-muted">
        <p>
          Showing <span className="font-bold text-off-white">{rows.length}</span>{" "}
          registration{rows.length === 1 ? "" : "s"}
        </p>
      </div>

      {/* Mobile Card List (< md) */}
      <ul className="space-y-4 md:hidden">
        {rows.map((r) => {
          const isCheckedIn = Boolean(r.checkedIn);
          return (
            <li
              key={r.reference}
              className={`rounded-2xl border p-4 transition-all ${
                isCheckedIn
                  ? "border-court-green/40 bg-court-green/[0.04]"
                  : "border-white/10 bg-black/40"
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate font-display font-bold text-base text-off-white">
                    {r.player.fullName}
                  </p>
                  <p className="truncate text-xs text-muted">{r.tournamentName}</p>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <span
                    className={`shrink-0 rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${
                      r.status === "paid"
                        ? "bg-court-green/15 text-court-green"
                        : "bg-white/10 text-muted"
                    }`}
                  >
                    {r.status === "paid" ? "Paid" : "Awaiting payment"}
                  </span>
                  {isCheckedIn && (
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-court-green uppercase">
                      <CheckCircle2 className="size-3" />
                      <span>Arrived</span>
                    </span>
                  )}
                </div>
              </div>

              <div className="mt-2.5 flex flex-wrap gap-1">
                {r.events.map((ev) => (
                  <span
                    key={ev}
                    className="rounded-md border border-white/10 bg-white/5 px-2 py-0.5 text-xs font-medium text-off-white"
                  >
                    {ev}
                  </span>
                ))}
              </div>

              {r.player.club && (
                <p className="mt-2 text-xs text-muted">
                  Club: <span className="text-off-white">{r.player.club}</span>
                </p>
              )}

              <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-white/5 pt-3 text-xs text-muted">
                <span className="font-display font-bold text-off-white">
                  {formatInr(r.total)}
                </span>
                <span className="font-mono text-[11px]">{r.reference}</span>
                {r.checkedInAt && (
                  <span className="text-[11px] text-court-green">
                    {timeOnly.format(new Date(r.checkedInAt))}
                  </span>
                )}
              </div>

              {/* 1-Tap Check-In Desk Button on Phone */}
              <div className="mt-3.5 flex gap-2">
                <form action={toggleCheckInAction} className="flex-1">
                  <input type="hidden" name="reference" value={r.reference} />
                  <input
                    type="hidden"
                    name="checkedIn"
                    value={isCheckedIn ? "false" : "true"}
                  />
                  {isCheckedIn ? (
                    <button
                      type="submit"
                      className="inline-flex min-h-11 w-full items-center justify-center gap-1.5 rounded-xl border border-court-green/40 bg-court-green/10 text-xs font-bold text-court-green hover:bg-court-green/20 uppercase tracking-wider"
                    >
                      <CheckCircle2 className="size-3.5" />
                      <span>Checked In · Tap to Undo</span>
                    </button>
                  ) : (
                    <button
                      type="submit"
                      className="inline-flex min-h-11 w-full items-center justify-center gap-1.5 rounded-xl bg-court-green text-xs font-black text-black hover:bg-off-white uppercase tracking-wider shadow-md"
                    >
                      <QrCode className="size-3.5" />
                      <span>Check In Player</span>
                    </button>
                  )}
                </form>

                <a
                  href={`tel:${r.player.phone}`}
                  className="inline-flex min-h-11 items-center justify-center rounded-xl border border-white/15 px-3 text-xs font-semibold text-off-white hover:bg-white/5"
                  title="Call Player"
                >
                  Call
                </a>
              </div>
            </li>
          );
        })}
        {rows.length === 0 && (
          <li className="rounded-2xl border border-dashed border-white/10 p-12 text-center text-sm text-muted">
            No registrations match the selected filters.
          </li>
        )}
      </ul>

      {/* Desktop Table (md+) */}
      <div className="hidden overflow-x-auto rounded-2xl border border-white/10 bg-black/40 md:block [scrollbar-width:thin]">
        <table className="w-full min-w-[64rem] text-left text-sm">
          <thead className="border-b border-white/10 bg-white/[0.02] font-display text-xs uppercase tracking-[0.16em] text-muted">
            <tr>
              <th scope="col" className="py-3.5 pl-4 pr-3 font-semibold">
                Arrival Desk
              </th>
              <th scope="col" className="py-3.5 px-3 font-semibold">
                Ref / Player
              </th>
              <th scope="col" className="py-3.5 px-3 font-semibold">
                Tournament & Events
              </th>
              <th scope="col" className="py-3.5 px-3 font-semibold">
                Contact & Club
              </th>
              <th scope="col" className="py-3.5 px-3 font-semibold">
                Fee
              </th>
              <th scope="col" className="py-3.5 px-3 font-semibold">
                Payment
              </th>
              <th scope="col" className="py-3.5 pl-3 pr-4 font-semibold">
                Registered
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {rows.map((r) => {
              const isCheckedIn = Boolean(r.checkedIn);
              return (
                <tr
                  key={r.reference}
                  className={`transition-colors ${
                    isCheckedIn ? "bg-court-green/[0.03]" : "hover:bg-white/[0.02]"
                  }`}
                >
                  {/* Morning Desk Check-in Action Column */}
                  <td className="py-3.5 pl-4 pr-3 whitespace-nowrap">
                    <form action={toggleCheckInAction}>
                      <input type="hidden" name="reference" value={r.reference} />
                      <input
                        type="hidden"
                        name="checkedIn"
                        value={isCheckedIn ? "false" : "true"}
                      />
                      {isCheckedIn ? (
                        <div className="flex items-center gap-2">
                          <span className="inline-flex items-center gap-1 rounded-lg border border-court-green/40 bg-court-green/15 px-2.5 py-1 text-xs font-bold text-court-green">
                            <CheckCircle2 className="size-3" />
                            <span>Arrived</span>
                          </span>
                          <button
                            type="submit"
                            title="Undo arrival status"
                            className="rounded p-1 text-muted hover:text-off-white"
                          >
                            <Undo2 className="size-3" />
                          </button>
                        </div>
                      ) : (
                        <button
                          type="submit"
                          className="inline-flex items-center gap-1.5 rounded-lg bg-court-green px-3 py-1 font-display text-xs font-black uppercase text-black hover:bg-off-white transition-all shadow-sm"
                        >
                          <QrCode className="size-3" />
                          <span>Check In</span>
                        </button>
                      )}
                    </form>
                    {r.checkedInAt && (
                      <span className="block mt-1 font-mono text-[10px] text-muted">
                        {timeOnly.format(new Date(r.checkedInAt))}
                      </span>
                    )}
                  </td>

                  {/* Ref & Player Name */}
                  <td className="py-3.5 px-3">
                    <span className="block font-display font-bold text-off-white">
                      {r.player.fullName}
                    </span>
                    <span className="font-mono text-xs text-muted">{r.reference}</span>
                  </td>

                  {/* Tournament & Events */}
                  <td className="py-3.5 px-3">
                    <span className="block text-xs font-semibold text-off-white">
                      {r.tournamentName}
                    </span>
                    <span className="block text-xs text-muted">{r.events.join(", ")}</span>
                  </td>

                  {/* Contact & Club */}
                  <td className="py-3.5 px-3">
                    <span className="block text-xs text-off-white">{r.player.phone}</span>
                    <span className="block text-xs text-muted">
                      {r.player.club || r.player.city || "Direct Entry"}
                    </span>
                  </td>

                  {/* Fee Total */}
                  <td className="py-3.5 px-3 font-display font-bold tabular-nums text-off-white">
                    {formatInr(r.total)}
                  </td>

                  {/* Payment Status */}
                  <td className="py-3.5 px-3 whitespace-nowrap">
                    <span
                      className={`inline-block rounded-md px-2 py-0.5 text-xs font-semibold ${
                        r.status === "paid"
                          ? "bg-court-green/15 text-court-green"
                          : "bg-white/10 text-muted"
                      }`}
                    >
                      {r.status === "paid" ? "Paid" : "Awaiting"}
                    </span>
                  </td>

                  {/* Registered Timestamp */}
                  <td className="py-3.5 pl-3 pr-4 text-xs text-muted whitespace-nowrap">
                    {dateTime.format(r.createdAt)}
                  </td>
                </tr>
              );
            })}

            {rows.length === 0 && (
              <tr>
                <td colSpan={7} className="py-12 text-center text-sm text-muted">
                  No registrations found matching your query.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
