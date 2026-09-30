import CoachSection from "@/components/coach/CoachSection";
import HeroSection from "@/components/hero/HeroSection";
import ProgramsSection from "@/components/programs/ProgramsSection";
import SmashSection from "@/components/smash/SmashSection";
import CinematicStage from "@/components/stage/CinematicStage";

export default function Home() {
  return (
    <main id="main" className="relative">
      <CinematicStage>
        <HeroSection />
        <SmashSection />
      </CinematicStage>
      <CoachSection />
      <ProgramsSection />
      {/* Placeholder anchor for sections built in later phases. */}
      <div id="tournaments" className="sr-only scroll-mt-20">Tournaments coming soon</div>
    </main>
  );
}
