import CoachSection from "@/components/coach/CoachSection";
import HeroSection from "@/components/hero/HeroSection";
import ProgramsSection from "@/components/programs/ProgramsSection";
import SmashSection from "@/components/smash/SmashSection";
import CinematicStage from "@/components/stage/CinematicStage";
import TournamentsSection from "@/components/tournaments/TournamentsSection";

/** Tournament status depends on the date: re-render hourly. */
export const revalidate = 3600;

export default function Home() {
  return (
    <main id="main" className="relative">
      <CinematicStage>
        <HeroSection />
        <SmashSection />
      </CinematicStage>
      <CoachSection />
      <ProgramsSection />
      <TournamentsSection now={Date.now()} />
    </main>
  );
}
