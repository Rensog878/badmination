"use client";

import { useActionState } from "react";
import { loginUmpire } from "@/app/umpire/actions";
import FormField, { describedBy, inputClass } from "@/components/registration/FormField";

export default function UmpireLogin({ next }: { next: string }) {
  const [state, action, pending] = useActionState(loginUmpire, {});
  return (
    <form action={action} className="max-w-sm space-y-6">
      <input type="hidden" name="next" value={next} />
      <FormField id="passcode" label="Umpire passcode" error={state.error}>
        <input
          id="passcode"
          name="passcode"
          type="password"
          autoComplete="current-password"
          required
          className={inputClass}
          {...describedBy("passcode", state.error)}
        />
      </FormField>
      <button
        type="submit"
        disabled={pending}
        aria-busy={pending}
        className="rounded-lg bg-court-green px-7 py-4 font-display text-sm font-semibold tracking-[0.14em] text-black uppercase hover:bg-off-white disabled:opacity-60"
      >
        {pending ? "Checking…" : "Sign in"}
      </button>
    </form>
  );
}
