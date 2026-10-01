import CoachSection from "@/components/coach/CoachSection";
import HeroSection from "@/components/hero/HeroSection";
import ProgramsSection from "@/components/programs/ProgramsSection";
import ShowcaseSection from "@/components/showcase/ShowcaseSection";
import SmashSection from "@/components/smash/SmashSection";
import CinematicStage from "@/components/stage/CinematicStage";
import TournamentsSection from "@/components/tournaments/TournamentsSection";
import { FEATURES } from "@/lib/features";

/** Tournament status depends on the date: re-render hourly. */
export const revalidate = 3600;

export default function Home() {
  return (
    <main id="main" className="relative">
      <CinematicStage>
        <HeroSection />
        <SmashSection />
      </CinematicStage>
      {/* Focus: tournaments + the 3D story. Other sections are switched off in lib/features.ts. */}
      {FEATURES.coachProfile && <CoachSection />}
      {FEATURES.programs && <ProgramsSection />}
      <TournamentsSection now={Date.now()} />
      {FEATURES.showcase && <ShowcaseSection />}
    </main>
  );
}
