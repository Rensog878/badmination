"use client";

import { useActionState } from "react";
import type { FormState } from "@/app/admin/actions";
import { addMatchAction } from "@/app/admin/live-actions";
import FormField, { describedBy, FieldError, inputClass } from "@/components/registration/FormField";

export default function MatchForm({ slug, events }: { slug: string; events: string[] }) {
  const [state, action, pending] = useActionState<FormState, FormData>(addMatchAction, {});
  const e = (k: string) => state.fieldErrors?.[k];
  return (
    <form action={action} noValidate className="grid gap-5 sm:grid-cols-2">
      <input type="hidden" name="slug" value={slug} />
      <FormField id="event" label="Event" error={e("event")}>
        <select id="event" name="event" className={`${inputClass} bg-charcoal`} {...describedBy("event", e("event"))}>
          {events.map((ev) => (
            <option key={ev}>{ev}</option>
          ))}
        </select>
      </FormField>
      <FormField id="round" label="Round" error={e("round")}>
        <input id="round" name="round" placeholder="Quarter-final" className={inputClass} {...describedBy("round", e("round"))} />
      </FormField>
      <FormField id="a" label="Side A" error={e("a")} hint="Doubles: two names separated by /">
        <input id="a" name="a" className={inputClass} {...describedBy("a", e("a"), "hint")} />
      </FormField>
      <FormField id="b" label="Side B" error={e("b")}>
        <input id="b" name="b" className={inputClass} {...describedBy("b", e("b"))} />
      </FormField>
      <div className="sm:col-span-2">
        {state.error && <FieldError message={state.error} />}
        {state.ok && <p role="status" className="text-sm text-court-green">{state.ok}</p>}
        <button type="submit" disabled={pending} className="rounded-lg mt-3 bg-court-green px-6 py-3 font-display text-xs font-semibold tracking-[0.18em] text-black uppercase hover:bg-off-white disabled:opacity-60">
          {pending ? "Adding…" : "Add match"}
        </button>
      </div>
    </form>
  );
}
