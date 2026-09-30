import CoachSection from "@/components/coach/CoachSection";
import HeroSection from "@/components/hero/HeroSection";
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
      {/* Placeholder anchors for sections built in later phases. */}
      <div id="programs" className="sr-only scroll-mt-20">Programs coming soon</div>
      <div id="tournaments" className="sr-only scroll-mt-20">Tournaments coming soon</div>
    </main>
  );
}
