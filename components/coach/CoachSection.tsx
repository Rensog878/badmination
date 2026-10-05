import { ArrowRight } from "lucide-react";
import CoachPortrait from "@/components/coach/CoachPortrait";
import SmashBiomechanicsCard from "@/components/coach/SmashBiomechanicsCard";
import Reveal from "@/components/ui/Reveal";
import { COACH, COACH_NAME } from "@/lib/content";

/** MEET THE COACH: editorial profile. Server-rendered; only the reveals run on the client. */
export default function CoachSection() {
  return (
    <section id="coach" aria-labelledby="coach-heading" className="relative scroll-mt-20 bg-charcoal">
      <div className="mx-auto max-w-[1600px] px-4 py-24 sm:px-8 md:py-32 lg:px-16 lg:py-40">
        <div className="grid gap-12 lg:grid-cols-12 lg:gap-16">
          <Reveal className="lg:col-span-5">
            <div className="lg:sticky lg:top-28">
              <CoachPortrait />
            </div>
          </Reveal>

          <div className="lg:col-span-7">
            <Reveal stagger>
              <p className="flex items-center gap-3 font-display text-xs font-medium tracking-[0.18em] text-court-green uppercase">
                <span aria-hidden="true" className="h-px w-8 bg-court-green" />
                {COACH.chapter}
              </p>
              <h2
                id="coach-heading"
                className="mt-6 font-display text-[clamp(2.75rem,7vw,6rem)] leading-[0.9] font-bold tracking-[-0.03em] uppercase"
              >
                {COACH_NAME}
              </h2>
              <p className="mt-4 font-display text-sm tracking-[0.2em] text-muted uppercase">{COACH.role}</p>
              <p className="mt-10 max-w-2xl font-display text-2xl leading-snug font-medium sm:text-3xl">
                {COACH.lead}
              </p>
              <div className="mt-6 max-w-2xl space-y-4 text-base leading-relaxed text-muted sm:text-lg">
                {COACH.bio.map((paragraph) => (
                  <p key={paragraph}>{paragraph}</p>
                ))}
              </div>
            </Reveal>

            <Reveal as="dl" stagger className="mt-14 grid grid-cols-2 border-y border-off-white/10 sm:grid-cols-3">
              {COACH.stats.map((stat) => (
                <div
                  key={stat.label}
                  className="flex flex-col-reverse border-off-white/10 py-6 pr-3 not-first:border-l not-first:pl-4 sm:py-8 sm:not-first:pl-8"
                >
                  <dt className="mt-2 text-xs tracking-[0.2em] text-muted uppercase sm:text-xs">{stat.label}</dt>
                  <dd className="font-display text-[clamp(1.75rem,5vw,3.5rem)] leading-none font-bold text-off-white">
                    {stat.value}
                  </dd>
                </div>
              ))}
            </Reveal>

            <h3 className="mt-20 font-display text-xs font-medium tracking-[0.18em] text-muted uppercase">
              Coaching philosophy
            </h3>
            <Reveal stagger className="mt-6 grid gap-px overflow-hidden rounded-2xl bg-off-white/10 sm:grid-cols-2">
              {COACH.pillars.map((pillar, i) => (
                <article key={pillar.title} className="group bg-charcoal p-6 sm:p-8">
                  <span className="font-display text-xs tracking-[0.18em] text-court-green">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <h4 className="mt-4 font-display text-2xl font-bold tracking-[-0.01em] uppercase">{pillar.title}</h4>
                  <p className="mt-3 leading-relaxed text-muted">{pillar.text}</p>
                  <span
                    aria-hidden="true"
                    className="mt-6 block h-px w-10 bg-court-green transition-[width] duration-500 group-hover:w-20 motion-reduce:transition-none"
                  />
                </article>
              ))}
            </Reveal>

            <Reveal className="mt-16">
              <SmashBiomechanicsCard />
            </Reveal>

            <h3 className="mt-20 font-display text-xs font-medium tracking-[0.18em] text-muted uppercase">Career</h3>
            <Reveal as="ol" stagger className="relative mt-6 border-l border-off-white/15">
                {COACH.milestones.map((m) => (
                  <li key={m.year} className="relative py-4 pl-8">
                    <span aria-hidden="true" className="absolute top-[1.55rem] -left-[5px] size-[9px] rounded-full bg-court-green" />
                    <span className="font-display text-sm font-semibold tracking-[0.15em] text-court-green">{m.year}</span>
                    <p className="mt-1 text-off-white">{m.text}</p>
                  </li>
                ))}
            </Reveal>

            <Reveal className="mt-14">
              <a
                href={COACH.cta.href}
                className="rounded-lg group inline-flex items-center gap-3 bg-court-green px-7 py-4 font-display text-sm font-semibold tracking-[0.14em] text-black uppercase transition-colors hover:bg-off-white"
              >
                {COACH.cta.label}
                <ArrowRight
                  aria-hidden="true"
                  className="size-4 transition-transform group-hover:translate-x-1 motion-reduce:transition-none"
                />
              </a>
            </Reveal>
          </div>
        </div>
      </div>
    </section>
  );
}
