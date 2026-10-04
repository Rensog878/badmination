import ProgramExplorer from "@/components/programs/ProgramExplorer";
import TrialBookingButton from "@/components/programs/TrialBookingButton";
import Reveal from "@/components/ui/Reveal";
import { PROGRAMS_INTRO, TRIAL } from "@/lib/content";

/** TRAIN: program tracks with an audience filter, then a trial-booking band. */
export default function ProgramsSection() {
  return (
    <section id="programs" aria-labelledby="programs-heading" className="relative scroll-mt-20 border-t border-off-white/10 bg-charcoal">
      <div className="mx-auto max-w-[1600px] px-4 py-24 sm:px-8 md:py-32 lg:px-16 lg:py-40">
        <Reveal stagger className="max-w-3xl">
          <p className="flex items-center gap-3 font-display text-xs font-medium tracking-[0.18em] text-court-green uppercase">
            <span aria-hidden="true" className="h-px w-8 bg-court-green" />
            {PROGRAMS_INTRO.chapter}
          </p>
          <h2
            id="programs-heading"
            className="mt-6 font-display text-[clamp(2.5rem,6.5vw,5.5rem)] leading-[0.92] font-bold tracking-[-0.03em] uppercase"
          >
            {PROGRAMS_INTRO.headline}
          </h2>
          <p className="mt-6 max-w-xl text-base leading-relaxed text-muted sm:text-lg">{PROGRAMS_INTRO.lead}</p>
        </Reveal>

        <Reveal className="mt-14">
          <ProgramExplorer />
        </Reveal>

        <Reveal className="mt-20">
          <div
            id="book-trial"
            className="relative flex scroll-mt-24 flex-col gap-8 overflow-hidden rounded-2xl border border-court-green/40 bg-black p-8 sm:p-12 lg:flex-row lg:items-center lg:justify-between"
          >
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_90%_50%,rgba(16,185,129,0.14),transparent_60%)]"
            />
            <div className="relative max-w-xl">
              <h3 className="font-display text-3xl leading-tight font-bold tracking-[-0.02em] uppercase sm:text-4xl">
                {TRIAL.headline}
              </h3>
              <p className="mt-3 text-muted">{TRIAL.text}</p>
            </div>
            <TrialBookingButton label={TRIAL.cta} />
          </div>
        </Reveal>
      </div>
    </section>
  );
}
