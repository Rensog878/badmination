"use client";

import { useActionState } from "react";
import type { FormState } from "@/app/admin/actions";
import { createTestimonialAction } from "@/app/admin/media-actions";
import FormField, { describedBy, FieldError, inputClass } from "@/components/registration/FormField";

export default function TestimonialForm() {
  const [state, action, pending] = useActionState<FormState, FormData>(createTestimonialAction, {});
  const e = (k: string) => state.fieldErrors?.[k];
  return (
    <form action={action} noValidate className="space-y-5">
      <FormField id="quote" label="Quote" error={e("quote")}>
        <textarea id="quote" name="quote" rows={3} maxLength={400} className={inputClass} {...describedBy("quote", e("quote"))} />
      </FormField>
      <div className="grid gap-5 sm:grid-cols-2">
        <FormField id="attribution" label="Name as they agreed to be shown" error={e("attribution")}>
          <input id="attribution" name="attribution" className={inputClass} {...describedBy("attribution", e("attribution"))} />
        </FormField>
        <FormField id="context" label="Context" optional>
          <input id="context" name="context" placeholder="e.g. Parent, U13 squad" className={inputClass} />
        </FormField>
      </div>
      <label className="flex items-start gap-3 text-sm">
        <input type="checkbox" name="consent" className="mt-0.5 size-5 accent-court-green" {...describedBy("consent", e("consent"))} />
        This person agreed to this quote being published with this name.
      </label>
      {e("consent") && <FieldError id="consent-error" message={e("consent") ?? ""} />}
      {state.ok && <p role="status" className="text-sm text-court-green">{state.ok}</p>}
      <button type="submit" disabled={pending} className="rounded-lg bg-court-green px-6 py-3 font-display text-xs font-semibold tracking-[0.18em] text-black uppercase hover:bg-off-white disabled:opacity-60">
        {pending ? "Saving…" : "Publish testimonial"}
      </button>
    </form>
  );
}
