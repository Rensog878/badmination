import TournamentExplorer from "@/components/tournaments/TournamentExplorer";
import { listTournaments } from "@/lib/data/tournaments";
import Reveal from "@/components/ui/Reveal";
import { TOURNAMENTS_INTRO } from "@/lib/content";

interface TournamentsSectionProps {
  now: number;
}

/** COMPETE → REGISTER: tournament discovery listing. */
export default async function TournamentsSection({ now }: TournamentsSectionProps) {
  const tournaments = await listTournaments();
  return (
    <section
      id="tournaments"
      aria-labelledby="tournaments-heading"
      className="relative scroll-mt-20 border-t border-off-white/10 bg-charcoal"
    >
      <div className="mx-auto max-w-[1600px] px-4 py-24 sm:px-8 md:py-32 lg:px-16 lg:py-40">
        <Reveal stagger className="max-w-3xl">
          <p className="flex items-center gap-3 font-display text-xs font-medium tracking-[0.18em] text-court-green uppercase">
            <span aria-hidden="true" className="h-px w-8 bg-court-green" />
            {TOURNAMENTS_INTRO.chapter}
          </p>
          <h2
            id="tournaments-heading"
            className="mt-6 font-display text-[clamp(2.5rem,6.5vw,5.5rem)] leading-[0.92] font-bold tracking-[-0.03em] uppercase"
          >
            {TOURNAMENTS_INTRO.headline}
          </h2>
          <p className="mt-6 max-w-xl text-base leading-relaxed text-muted sm:text-lg">{TOURNAMENTS_INTRO.lead}</p>
        </Reveal>

        <Reveal className="mt-14">
          <TournamentExplorer now={now} tournaments={tournaments} />
        </Reveal>
      </div>
    </section>
  );
}
