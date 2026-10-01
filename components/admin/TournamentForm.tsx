"use client";

import { useActionState } from "react";
import { saveTournamentAction, type FormState } from "@/app/admin/actions";
import FormField, { describedBy, FieldError, inputClass } from "@/components/registration/FormField";
import { AGE_GROUPS, EVENT_TYPES, LEVELS } from "@/lib/admin/tournamentSchema";
import type { Tournament } from "@/lib/tournaments";

/** Create/edit form. Server action validates with the same Zod schema; errors map back to fields. */
export default function TournamentForm({ tournament }: { tournament?: Tournament }) {
  const [state, action, pending] = useActionState<FormState, FormData>(saveTournamentAction, {});
  const e = (k: string) => state.fieldErrors?.[k];
  const has = (age: string, type: string) => tournament?.events.some((ev) => ev.ageGroup === age && ev.type === type) ?? false;

  const text = (name: keyof Tournament, label: string, opts: { type?: string; hint?: string; className?: string } = {}) => (
    <FormField id={name} label={label} error={e(name)} hint={opts.hint} className={opts.className}>
      <input
        id={name}
        name={name}
        type={opts.type ?? "text"}
        defaultValue={tournament ? String(tournament[name] ?? "") : ""}
        className={inputClass}
        {...describedBy(name, e(name), opts.hint)}
      />
    </FormField>
  );

  return (
    <form action={action} noValidate className="space-y-8">
      {tournament && <input type="hidden" name="previousSlug" value={tournament.slug} />}
      {state.error && (
        <div role="alert">
          <FieldError message={state.error} />
        </div>
      )}
      <div className="grid gap-6 sm:grid-cols-2">
        {text("name", "Name")}
        {text("slug", "URL slug", { hint: "e.g. autumn-open-2026 → /tournaments/autumn-open-2026" })}
        {text("venue", "Venue")}
        {text("city", "City")}
        <FormField id="level" label="Level" error={e("level")}>
          <select id="level" name="level" defaultValue={tournament?.level ?? ""} className={`${inputClass} bg-charcoal`} {...describedBy("level", e("level"))}>
            <option value="">Select…</option>
            {LEVELS.map((l) => (
              <option key={l} value={l}>{l}</option>
            ))}
          </select>
        </FormField>
        {text("prizePool", "Prize pool (₹)", { type: "number", hint: "Optional" })}
        {text("startDate", "First day of play", { type: "date" })}
        {text("endDate", "Last day of play", { type: "date" })}
        {text("registrationOpens", "Entries open", { type: "date" })}
        {text("registrationCloses", "Entries close", { type: "date" })}
        {text("entryFee", "Entry fee per event (₹)", { type: "number" })}
        {text("capacity", "Draw capacity (entries)", { type: "number" })}
      </div>

      <fieldset aria-describedby={e("events") ? "events-error" : undefined}>
        <legend className="mb-3 font-display text-xs font-medium tracking-[0.18em] uppercase">Events</legend>
        <div className="overflow-x-auto">
          <table className="text-sm">
            <thead>
              <tr>
                <th />
                {EVENT_TYPES.map((type) => (
                  <th key={type} scope="col" className="px-4 pb-2 font-display text-xs font-medium tracking-[0.2em] text-muted uppercase">{type}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {AGE_GROUPS.map((age) => (
                <tr key={age}>
                  <th scope="row" className="pr-4 text-left font-display">{age}</th>
                  {EVENT_TYPES.map((type) => (
                    <td key={type} className="px-4 py-2 text-center">
                      <input type="checkbox" name="events" value={`${age}|${type}`} defaultChecked={has(age, type)} aria-label={`${age} ${type}`} className="size-5 accent-court-green" />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {e("events") && <FieldError id="events-error" message={e("events") ?? ""} />}
      </fieldset>

      {tournament && (
        <p className="text-sm text-muted">
          Paid entries so far: {tournament.registered}. This count updates automatically from payments.
        </p>
      )}

      <button type="submit" disabled={pending} aria-busy={pending} className="rounded-lg bg-court-green px-7 py-4 font-display text-sm font-semibold tracking-[0.14em] text-black uppercase hover:bg-off-white disabled:opacity-60">
        {pending ? "Saving…" : tournament ? "Save changes" : "Create tournament"}
      </button>
    </form>
  );
}
