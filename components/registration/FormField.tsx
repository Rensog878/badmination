import type { ReactNode } from "react";
import { AlertCircle } from "lucide-react";

export const inputClass =
  "w-full rounded-xl border border-white/15 bg-white/[0.03] px-4 py-3 text-off-white placeholder:text-muted/60 transition-all focus:border-court-green focus:bg-white/[0.06] focus:ring-1 focus:ring-court-green/50 focus:outline-none aria-invalid:border-red-400/80";

interface FormFieldProps {
  id: string;
  label: string;
  error?: string;
  hint?: string;
  optional?: boolean;
  children: ReactNode;
  className?: string;
}

/** Label + control + hint/error. Errors use an icon and text, never colour alone. */
export default function FormField({ id, label, error, hint, optional, children, className = "" }: FormFieldProps) {
  return (
    <div className={className}>
      <label htmlFor={id} className="mb-2 flex items-baseline justify-between font-display text-xs font-bold tracking-[0.16em] uppercase">
        {label}
        {optional && <span className="text-xs font-normal tracking-[0.1em] text-muted normal-case">Optional</span>}
      </label>
      {children}
      {hint && !error && (
        <p id={`${id}-hint`} className="mt-2 text-xs text-muted">
          {hint}
        </p>
      )}
      {error && <FieldError id={`${id}-error`} message={error} />}
    </div>
  );
}

export function FieldError({ id, message }: { id?: string; message: string }) {
  return (
    <p id={id} className="field-error-in mt-2 flex items-start gap-2 text-sm font-medium text-off-white">
      <AlertCircle aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-court-green" />
      {message}
    </p>
  );
}

/** aria props wiring a control to its hint/error. */
export const describedBy = (id: string, error?: string, hint?: string) => ({
  "aria-invalid": error ? true : undefined,
  "aria-describedby": error ? `${id}-error` : hint ? `${id}-hint` : undefined,
});
