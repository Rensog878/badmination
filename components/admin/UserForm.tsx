"use client";

import { useActionState } from "react";
import { createUserAction, type FormState } from "@/app/admin/actions";
import FormField, { describedBy, FieldError, inputClass } from "@/components/registration/FormField";

export default function UserForm() {
  const [state, action, pending] = useActionState<FormState, FormData>(createUserAction, {});
  const e = (k: string) => state.fieldErrors?.[k];
  return (
    <form action={action} noValidate className="grid gap-5 sm:grid-cols-2">
      <FormField id="name" label="Name" error={e("name")}>
        <input id="name" name="name" className={inputClass} {...describedBy("name", e("name"))} />
      </FormField>
      <FormField id="email" label="Email" error={e("email")}>
        <input id="email" name="email" type="email" autoComplete="off" className={inputClass} {...describedBy("email", e("email"))} />
      </FormField>
      <FormField id="role" label="Role" error={e("role")}>
        <select id="role" name="role" defaultValue="umpire" className={`${inputClass} bg-charcoal`}>
          <option value="umpire">Umpire (live scoring only)</option>
          <option value="admin">Admin (everything)</option>
        </select>
      </FormField>
      <FormField id="password" label="Temporary password" error={e("password")} hint="At least 12 characters. Share it privately.">
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="new-password"
          className={inputClass}
          {...describedBy("password", e("password"), "hint")}
        />
      </FormField>
      <div className="sm:col-span-2">
        {state.error && <FieldError message={state.error} />}
        {state.ok && (
          <p role="status" className="text-sm text-court-green">
            {state.ok}
          </p>
        )}
        <button
          type="submit"
          disabled={pending}
          className="rounded-lg mt-3 bg-court-green px-6 py-3 font-display text-xs font-semibold tracking-[0.18em] text-black uppercase hover:bg-off-white disabled:opacity-60"
        >
          {pending ? "Creating…" : "Create account"}
        </button>
      </div>
    </form>
  );
}
