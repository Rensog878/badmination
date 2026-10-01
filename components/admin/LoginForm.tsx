"use client";

import { useActionState } from "react";
import { adminLogin, type FormState } from "@/app/admin/actions";
import FormField, { describedBy, FieldError, inputClass } from "@/components/registration/FormField";

export default function LoginForm({ next }: { next: string }) {
  const [state, action, pending] = useActionState<FormState, FormData>(adminLogin, {});
  return (
    <form action={action} className="space-y-6">
      <input type="hidden" name="next" value={next} />
      <FormField id="email" label="Email">
        <input id="email" name="email" type="email" autoComplete="username" required className={inputClass} />
      </FormField>
      <FormField id="password" label="Password">
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          className={inputClass}
          {...describedBy("password", state.error)}
        />
      </FormField>
      {state.error && (
        <div role="alert">
          <FieldError id="password-error" message={state.error} />
        </div>
      )}
      <button
        type="submit"
        disabled={pending}
        aria-busy={pending}
        className="w-full bg-court-green px-7 py-4 font-display text-sm font-semibold tracking-[0.14em] text-black uppercase hover:bg-off-white disabled:opacity-60"
      >
        {pending ? "Signing in…" : "Sign in"}
      </button>
    </form>
  );
}
