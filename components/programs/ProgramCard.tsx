import { ArrowRight, Check } from "lucide-react";
import type { Program } from "@/lib/content";

interface ProgramCardProps {
  program: Program;
  index: number;
}

export default function ProgramCard({ program, index }: ProgramCardProps) {
  const featured = program.featured === true;
  return (
    <article
      aria-labelledby={`${program.id}-title`}
      className={`group relative flex h-full flex-col rounded-2xl border bg-black/40 p-6 transition-colors duration-300 hover:border-court-green/60 sm:p-8 ${
        featured ? "border-court-green/70" : "border-off-white/10"
      }`}
    >
      {featured && (
        <span className="absolute -top-3 right-6 rounded-full bg-court-green px-3 py-1 font-display text-xs font-semibold tracking-[0.15em] text-black uppercase">
          Flagship
        </span>
      )}
      <div className="flex items-center justify-between font-display text-xs tracking-[0.18em] uppercase">
        <span className="text-court-green">{String(index + 1).padStart(2, "0")}</span>
        <span className="text-muted">{program.level}</span>
      </div>

      <h3 id={`${program.id}-title`} className="mt-6 font-display text-2xl leading-tight font-bold tracking-[-0.01em] uppercase sm:text-3xl">
        {program.name}
      </h3>
      <p className="mt-3 leading-relaxed text-muted">{program.summary}</p>

      <dl className="mt-6 grid grid-cols-3 border-y border-off-white/10">
        {program.format.map((f) => (
          <div key={f.label} className="flex flex-col-reverse py-4 not-first:border-l not-first:border-off-white/10 not-first:pl-3">
            <dt className="mt-1 text-xs tracking-[0.2em] text-muted uppercase">{f.label}</dt>
            <dd className="font-display text-sm font-semibold text-off-white sm:text-base">{f.value}</dd>
          </div>
        ))}
      </dl>

      <ul className="mt-6 flex-1 space-y-2.5">
        {program.focus.map((item) => (
          <li key={item} className="flex gap-3 text-sm text-off-white/90">
            <Check aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-court-green" />
            {item}
          </li>
        ))}
      </ul>

      <a
        href="#book-trial"
        aria-label={`Book a trial for ${program.name}`}
        className={`mt-8 inline-flex items-center justify-between gap-3 px-5 py-3.5 font-display text-xs font-semibold tracking-[0.18em] uppercase transition-colors ${
          featured
            ? "bg-court-green text-black hover:bg-off-white"
            : "border border-off-white/20 text-off-white hover:border-court-green hover:text-court-green"
        }`}
      >
        Book a trial
        <ArrowRight aria-hidden="true" className="size-4 transition-transform group-hover:translate-x-1 motion-reduce:transition-none" />
      </a>
    </article>
  );
}
