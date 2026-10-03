"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { useForm, type FieldErrors, type FieldPath } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, ArrowRight, Check, CircleCheck } from "lucide-react";
import { AnimatePresence, m, type Variants } from "motion/react";
import MotionProvider from "@/components/ui/MotionProvider";
import FormField, { describedBy, FieldError, inputClass } from "@/components/registration/FormField";
import PaymentPanel from "@/components/registration/PaymentPanel";
import { submitRegistration, type RegistrationResult } from "@/app/tournaments/[slug]/register/actions";
import {
  ageAtCutoff,
  crossFieldIssues,
  emptyRegistration,
  eventKey,
  isEligible,
  isMinor,
  makeRegistrationSchema,
  needsPartner,
  registrationTotal,
  type RegistrationValues,
} from "@/lib/registration";
import { eventLabel, formatInr, formatRange, type Tournament } from "@/lib/tournaments";

type Path = FieldPath<RegistrationValues>;

const STEPS: { title: string; fields: Path[] }[] = [
  { title: "Player", fields: ["player"] },
  { title: "Events", fields: ["events", "partners"] },
  { title: "Contacts", fields: ["emergency", "guardianName", "consents"] },
  { title: "Review", fields: [] },
];

const GENDERS = [
  { value: "female", label: "Female" },
  { value: "male", label: "Male" },
  { value: "other", label: "Other / prefer not to say" },
] as const;

// Step content slides in from the side you're heading to (direction: 1 forward, -1 back).
const stepVariants: Variants = {
  enter: (dir: number) => ({ opacity: 0, x: dir * 32 }),
  center: { opacity: 1, x: 0, transition: { type: "spring", stiffness: 380, damping: 34 } },
  exit: (dir: number) => ({ opacity: 0, x: dir * -32, transition: { duration: 0.15 } }),
};
const tap = { scale: 0.97 };

/** Reads a nested error message by dotted path. */
function errorAt(errors: FieldErrors<RegistrationValues>, path: string): string | undefined {
  let node: unknown = errors;
  for (const part of path.split(".")) {
    if (node === null || typeof node !== "object") return undefined;
    node = (node as Record<string, unknown>)[part];
  }
  if (node && typeof node === "object" && "message" in node && typeof node.message === "string") return node.message;
  return undefined;
}

export default function RegistrationForm({ tournament: t }: { tournament: Tournament }) {
  const schema = useMemo(() => makeRegistrationSchema(t), [t]);
  const {
    register,
    handleSubmit,
    trigger,
    watch,
    setError,
    getValues,
    reset,
    formState: { errors },
  } = useForm<RegistrationValues>({
    resolver: zodResolver(schema),
    defaultValues: emptyRegistration,
    mode: "onTouched",
  });

  const [step, setStep] = useState(0);
  const [formError, setFormError] = useState<string | null>(null);
  const [result, setResult] = useState<Extract<RegistrationResult, { ok: true }> | null>(null);
  const [pending, startTransition] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const firstRender = useRef(true);
  const prevStep = useRef(0);
  const direction = step >= prevStep.current ? 1 : -1;
  useEffect(() => {
    prevStep.current = step;
  }, [step]);
  const draftKey = `registration-draft:${t.slug}`;

  // Draft autosave: a refresh or accidental back-swipe on a phone shouldn't lose the form.
  useEffect(() => {
    try {
      const saved = sessionStorage.getItem(draftKey);
      if (saved) reset({ ...emptyRegistration, ...(JSON.parse(saved) as Partial<RegistrationValues>) });
    } catch {
      // Storage unavailable (private mode) or a stale draft: start fresh.
    }
    const sub = watch((values) => {
      try {
        sessionStorage.setItem(draftKey, JSON.stringify(values));
      } catch {
        // ignore quota / privacy errors
      }
    });
    return () => sub.unsubscribe();
  }, [draftKey, reset, watch]);

  const dob = watch("player.dateOfBirth");
  const selected = watch("events");
  const age = ageAtCutoff(dob, t);
  const minor = isMinor(dob, t);
  const year = t.startDate.slice(0, 4);
  const total = registrationTotal(t, selected);
  const err = (path: string) => errorAt(errors, path);

  // Move focus to the step heading so screen readers announce the new step.
  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    headingRef.current?.focus();
  }, [step, result]);

  // Synchronize form steps with browser history and phone back gestures
  useEffect(() => {
    if (typeof window !== "undefined") {
      window.history.replaceState({ regStep: 0 }, "");
    }
    const onPop = (e: PopStateEvent) => {
      if (e.state && typeof e.state.regStep === "number") {
        setStep(e.state.regStep);
      } else {
        setStep(0);
      }
    };
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  const focusFirstInvalid = () =>
    requestAnimationFrame(() => formRef.current?.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus());

  const next = async () => {
    const fields = STEPS[step].fields;
    const ok = await trigger(fields, { shouldFocus: false });
    const crossIssues = crossFieldIssues(getValues(), t).filter((i) => fields.includes(i.path[0] as Path));
    crossIssues.forEach((i) => setError(i.path.join(".") as Path, { message: i.message }));
    if (ok && crossIssues.length === 0) {
      const nextStep = Math.min(step + 1, STEPS.length - 1);
      if (typeof window !== "undefined") {
        window.history.pushState({ regStep: nextStep }, "");
      }
      setStep(nextStep);
    } else {
      focusFirstInvalid();
    }
  };

  const handlePrevStep = () => {
    if (step > 0 && typeof window !== "undefined") {
      window.history.back();
    } else {
      setStep((s) => Math.max(0, s - 1));
    }
  };

  const onSubmit = handleSubmit(
    (values) => {
      setFormError(null);
      startTransition(async () => {
        const res = await submitRegistration(t.slug, values);
        if (res.ok) {
          setResult(res);
          try {
            sessionStorage.removeItem(draftKey);
          } catch {
            // ignore
          }
          return;
        }
        setFormError(res.formError ?? "Something went wrong. Please try again.");
        if (res.fieldErrors) {
          const paths = Object.keys(res.fieldErrors);
          paths.forEach((p) => setError(p as Path, { message: res.fieldErrors?.[p] }));
          const stepIndex = STEPS.findIndex((s) => s.fields.some((f) => paths.some((p) => p.startsWith(f))));
          if (stepIndex >= 0) setStep(stepIndex);
        }
      });
    },
    (errs) => {
      const stepIndex = STEPS.findIndex((s) => s.fields.some((f) => errorAt(errs, f) || (errs as Record<string, unknown>)[f.split(".")[0]]));
      if (stepIndex >= 0) setStep(stepIndex);
      focusFirstInvalid();
    },
  );

  // Re-submits the same (already valid) entry to get a fresh payment order.
  const retryPayment = () =>
    startTransition(async () => {
      const res = await submitRegistration(t.slug, getValues());
      if (res.ok) setResult(res);
    });

  if (result) {
    return (
      <MotionProvider>
      <m.section initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} aria-labelledby="done-heading" className="rounded-2xl border border-court-green/50 bg-black p-8 sm:p-12">
        <m.span className="inline-block" initial={{ scale: 0.4, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: "spring", stiffness: 500, damping: 18, delay: 0.1 }}>
          <CircleCheck aria-hidden="true" className="size-10 text-court-green" />
        </m.span>
        <h2 id="done-heading" ref={headingRef} tabIndex={-1} className="mt-6 font-display text-3xl font-bold uppercase focus:outline-none sm:text-4xl">
          Entry details confirmed
        </h2>
        <p className="mt-3 max-w-xl text-muted">
          Your details passed all checks. Your place is confirmed once payment is complete.
        </p>
        <dl className="mt-8 grid gap-px border border-off-white/10 bg-off-white/10 sm:grid-cols-3">
          {[
            { label: "Reference", value: result.reference },
            { label: "Events", value: String(result.events.length) },
            { label: "Total due", value: formatInr(result.total) },
          ].map((f) => (
            <div key={f.label} className="flex flex-col-reverse bg-black p-5">
              <dt className="mt-1 text-xs tracking-[0.2em] text-muted uppercase">{f.label}</dt>
              <dd className="font-display text-xl font-semibold">{f.value}</dd>
            </div>
          ))}
        </dl>
        <div className="mt-8">
          {result.payment ? (
            <PaymentPanel
              order={result.payment}
              slug={t.slug}
              tournamentName={t.name}
              reference={result.reference}
              prefill={{
                name: getValues("player.fullName"),
                email: getValues("player.email"),
                contact: getValues("player.phone"),
              }}
            />
          ) : result.paymentError ? (
            <div role="alert">
              <FieldError message={result.paymentError} />
              <button
                type="button"
                onClick={retryPayment}
                disabled={pending}
                aria-busy={pending}
                className="rounded-lg mt-4 border border-court-green px-6 py-3 font-display text-xs font-semibold tracking-[0.18em] text-court-green uppercase hover:bg-court-green hover:text-black disabled:opacity-60"
              >
                {pending ? "Retrying…" : "Try payment again"}
              </button>
            </div>
          ) : (
            <p className="border border-dashed border-off-white/20 px-5 py-4 text-sm text-muted">
              Online payment isn&apos;t available yet. Keep your reference; the organiser will contact you to complete payment.
            </p>
          )}
        </div>
      </m.section>
      </MotionProvider>
    );
  }

  const values = getValues();

  return (
    <MotionProvider>
    <form ref={formRef} onSubmit={onSubmit} noValidate aria-describedby={formError ? "form-error" : undefined}>
      <ol className="mb-10 grid grid-cols-4 gap-2" aria-label="Registration steps">
        {STEPS.map((s, i) => (
          <li key={s.title} aria-current={i === step ? "step" : undefined}>
            <span className="block h-1 overflow-hidden rounded-full bg-off-white/15">
              <m.span className="block h-full origin-left rounded-full bg-court-green" initial={false} animate={{ scaleX: i <= step ? 1 : 0 }} transition={{ duration: 0.5, ease: [0.2, 0.8, 0.2, 1] }} />
            </span>
            {i < step ? (
              // Completed steps are tappable, so people can go back and fix something directly.
              <button
                type="button"
                onClick={() => setStep(i)}
                className="mt-2 flex min-h-8 w-full items-center justify-center gap-1 font-display text-[10px] tracking-[0.06em] text-muted uppercase underline-offset-4 hover:text-off-white hover:underline sm:min-h-11 sm:justify-start sm:gap-1.5 sm:text-xs sm:tracking-[0.12em]"
              >
                <Check aria-hidden="true" className="size-3 text-court-green shrink-0 sm:size-3.5" />
                <span className="sr-only">Step {i + 1} of {STEPS.length}, completed, go back to: </span>
                <span className="truncate">{s.title}</span>
              </button>
            ) : (
              <span className={`mt-2 flex min-h-8 w-full items-center justify-center gap-1 font-display text-[10px] tracking-[0.06em] uppercase sm:min-h-11 sm:justify-start sm:gap-1.5 sm:text-xs sm:tracking-[0.12em] ${i === step ? "font-bold text-off-white" : "text-muted"}`}>
                <span className="sr-only">Step {i + 1} of {STEPS.length}: </span>
                <span className="truncate">{s.title}</span>
              </span>
            )}
          </li>
        ))}
      </ol>

      <h2 ref={headingRef} tabIndex={-1} className="font-display text-3xl font-bold uppercase focus:outline-none sm:text-4xl">
        {["Player details", "Choose events", "Contacts & consent", "Review your entry"][step]}
      </h2>

      {formError && (
        <div id="form-error" role="alert" className="mt-6 border border-off-white/30 bg-off-white/5 px-5 py-4">
          <FieldError message={formError} />
        </div>
      )}

      <div className="mt-8 overflow-x-clip">
        <AnimatePresence mode="wait" initial={false} custom={direction}>
        <m.div key={step} custom={direction} variants={stepVariants} initial="enter" animate="center" exit="exit">
        {step === 0 && (
          <div className="grid gap-6 sm:grid-cols-2">
            <FormField id="fullName" label="Full name" error={err("player.fullName")} className="sm:col-span-2">
              <input id="fullName" autoComplete="name" className={inputClass} {...describedBy("fullName", err("player.fullName"))} {...register("player.fullName")} />
            </FormField>
            <FormField id="dob" label="Date of birth" error={err("player.dateOfBirth")} hint={`Age groups use age on 31 Dec ${year}.`}>
              <input id="dob" type="date" autoComplete="bday" className={inputClass} {...describedBy("dob", err("player.dateOfBirth"), "hint")} {...register("player.dateOfBirth")} />
            </FormField>
            <FormField id="gender" label="Gender" error={err("player.gender")}>
              <select id="gender" className={`${inputClass} bg-charcoal`} {...describedBy("gender", err("player.gender"))} {...register("player.gender")}>
                <option value="">Select…</option>
                {GENDERS.map((g) => (
                  <option key={g.value} value={g.value}>
                    {g.label}
                  </option>
                ))}
              </select>
            </FormField>
            <FormField id="email" label="Email" error={err("player.email")}>
              <input id="email" type="email" autoComplete="email" className={inputClass} {...describedBy("email", err("player.email"))} {...register("player.email")} />
            </FormField>
            <FormField id="phone" label="Mobile" error={err("player.phone")} hint="10-digit Indian mobile, +91 optional.">
              <input id="phone" type="tel" inputMode="tel" autoComplete="tel" className={inputClass} {...describedBy("phone", err("player.phone"), "hint")} {...register("player.phone")} />
            </FormField>
            <FormField id="city" label="City" error={err("player.city")}>
              <input id="city" autoComplete="address-level2" className={inputClass} {...describedBy("city", err("player.city"))} {...register("player.city")} />
            </FormField>
            <FormField id="club" label="Club / academy" optional error={err("player.club")}>
              <input id="club" autoComplete="organization" className={inputClass} {...describedBy("club", err("player.club"))} {...register("player.club")} />
            </FormField>
          </div>
        )}

        {step === 1 && (
          <fieldset aria-describedby={err("events") ? "events-error" : undefined}>
            <legend className="sr-only">Events</legend>
            <p className="mb-5 text-sm text-muted">
              {age === null ? "Add a date of birth to check eligibility." : `Player age on 31 Dec ${year}: ${age}.`} {formatInr(t.entryFee)} per event.
            </p>
            <ul className="space-y-3">
              {t.events.map((e) => {
                const key = eventKey(e);
                const eligible = isEligible(e, age);
                const checked = selected.includes(key);
                const partnerError = err(`partners.${key}`);
                return (
                  <li key={key} className={`rounded-xl border p-5 transition-colors ${checked ? "border-court-green/60 bg-court-green/5" : "border-off-white/15"} ${eligible ? "" : "opacity-50"}`}>
                    <label className="flex cursor-pointer items-center gap-4">
                      <input type="checkbox" value={key} disabled={!eligible && !checked} className="size-5 accent-court-green" {...register("events")} />
                      <span className="flex-1">
                        <span className="block font-display font-semibold uppercase">{eventLabel(e)}</span>
                        <span className="text-xs text-muted">{eligible ? (needsPartner(e) ? "Partner required" : "Individual entry") : `Not eligible for ${e.ageGroup}`}</span>
                      </span>
                      <span className="font-display text-sm">{formatInr(t.entryFee)}</span>
                    </label>
                    {checked && needsPartner(e) && (
                      <m.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }}>
                      <FormField id={`partner-${key}`} label={`${e.type} partner`} error={partnerError} className="mt-5 sm:ml-9">
                        <input
                          id={`partner-${key}`}
                          className={inputClass}
                          placeholder="Partner's full name"
                          {...describedBy(`partner-${key}`, partnerError)}
                          {...register(`partners.${key}`)}
                        />
                      </FormField>
                      </m.div>
                    )}
                  </li>
                );
              })}
            </ul>
            {err("events") && <FieldError id="events-error" message={err("events") ?? ""} />}
          </fieldset>
        )}

        {step === 2 && (
          <div className="space-y-8">
            <div className="grid gap-6 sm:grid-cols-2">
              <FormField id="emergencyName" label="Emergency contact" error={err("emergency.name")}>
                <input id="emergencyName" className={inputClass} {...describedBy("emergencyName", err("emergency.name"))} {...register("emergency.name")} />
              </FormField>
              <FormField id="emergencyPhone" label="Emergency mobile" error={err("emergency.phone")}>
                <input id="emergencyPhone" type="tel" inputMode="tel" className={inputClass} {...describedBy("emergencyPhone", err("emergency.phone"))} {...register("emergency.phone")} />
              </FormField>
              {minor && (
                <FormField id="guardianName" label="Parent / guardian name" error={err("guardianName")} hint="Required for players under 18." className="sm:col-span-2">
                  <input id="guardianName" className={inputClass} {...describedBy("guardianName", err("guardianName"), "hint")} {...register("guardianName")} />
                </FormField>
              )}
            </div>
            <fieldset className="space-y-4 border-t border-off-white/10 pt-8">
              <legend className="sr-only">Consents</legend>
              <label className="flex items-start gap-4">
                <input type="checkbox" className="mt-0.5 size-5 accent-court-green" {...describedBy("rules", err("consents.rules"))} {...register("consents.rules")} />
                <span>
                  I accept the tournament rules and confirm the details are correct{minor ? ", and I am the player's parent or guardian" : ""}.{" "}
                  <Link href={`/tournaments/${t.slug}#rules-heading`} className="text-court-green underline underline-offset-4" target="_blank">
                    Read the rules
                  </Link>
                </span>
              </label>
              {err("consents.rules") && <FieldError id="rules-error" message={err("consents.rules") ?? ""} />}
              <label className="flex items-start gap-4">
                <input type="checkbox" className="mt-0.5 size-5 accent-court-green" {...register("consents.media")} />
                <span className="text-muted">Photos and video of matches may be used on the website and social channels (optional).</span>
              </label>
            </fieldset>
          </div>
        )}

        {step === 3 && (
          <dl className="divide-y divide-off-white/10 border-y border-off-white/10">
            {[
              { label: "Player", value: `${values.player.fullName} · ${values.player.dateOfBirth} · ${GENDERS.find((g) => g.value === values.player.gender)?.label ?? ""}` },
              { label: "Contact", value: `${values.player.email} · ${values.player.phone} · ${values.player.city}` },
              ...(values.player.club ? [{ label: "Club", value: values.player.club }] : []),
              {
                label: "Events",
                value: values.events
                  .map((k) => {
                    const e = t.events.find((ev) => eventKey(ev) === k);
                    if (!e) return k;
                    return needsPartner(e) ? `${eventLabel(e)} with ${values.partners[k]}` : eventLabel(e);
                  })
                  .join(" · "),
              },
              { label: "Emergency", value: `${values.emergency.name} · ${values.emergency.phone}` },
              ...(minor ? [{ label: "Guardian", value: values.guardianName }] : []),
              { label: "Media consent", value: values.consents.media ? "Yes" : "No" },
            ].map((row) => (
              <div key={row.label} className="grid gap-1 py-4 sm:grid-cols-[10rem_1fr]">
                <dt className="font-display text-xs tracking-[0.2em] text-muted uppercase">{row.label}</dt>
                <dd className="break-words">{row.value}</dd>
              </div>
            ))}
          </dl>
        )}
        </m.div>
        </AnimatePresence>
      </div>

      <div className="mt-10 flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
        {step > 0 ? (
          <button
            type="button"
            onClick={handlePrevStep}
            className="inline-flex min-h-11 items-center justify-center gap-2 px-3 py-3 font-display text-xs font-semibold tracking-[0.2em] text-muted uppercase hover:text-off-white"
          >
            <ArrowLeft aria-hidden="true" className="size-4" />
            Back
          </button>
        ) : (
          <span />
        )}
        {step < STEPS.length - 1 ? (
          <m.button type="button" onClick={next} whileTap={tap} className="rounded-lg inline-flex items-center justify-center gap-3 bg-court-green px-7 py-4 font-display text-sm font-semibold tracking-[0.14em] text-black uppercase hover:bg-off-white">
            Continue
            <ArrowRight aria-hidden="true" className="size-4" />
          </m.button>
        ) : (
          <m.button type="submit" disabled={pending} aria-busy={pending} whileTap={pending ? undefined : tap} className="rounded-lg inline-flex items-center justify-center gap-3 bg-court-green px-7 py-4 font-display text-sm font-semibold tracking-[0.14em] text-black uppercase hover:bg-off-white disabled:opacity-60">
            {pending ? "Checking…" : `Confirm entry · ${formatInr(total)}`}
          </m.button>
        )}
      </div>
      <p className="sr-only" aria-live="polite">
        {`${selected.length} event${selected.length === 1 ? "" : "s"} selected, total ${formatInr(total)}`}
      </p>
      <p className="mt-6 text-xs text-muted">
        {t.name} · {formatRange(t.startDate, t.endDate)}
      </p>
    </form>
    </MotionProvider>
  );
}
