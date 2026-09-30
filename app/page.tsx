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
      {/* Placeholder anchors for the hero CTAs (built in later phases). */}
      <div id="coach" className="sr-only scroll-mt-20">Coach profile coming soon</div>
      <div id="programs" className="sr-only scroll-mt-20">Programs coming soon</div>
      <div id="tournaments" className="sr-only scroll-mt-20">Tournaments coming soon</div>
    </main>
  );
}
