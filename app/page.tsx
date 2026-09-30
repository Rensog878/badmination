import HeroSection from "@/components/hero/HeroSection";
import SmashSection from "@/components/smash/SmashSection";
import CinematicStage from "@/components/stage/CinematicStage";

export default function Home() {
  return (
    <main className="relative">
      <CinematicStage>
        <HeroSection />
        <SmashSection />
      </CinematicStage>
      {/* Placeholder anchors for the hero CTAs (built in later phases). */}
      <div id="programs" className="sr-only">Programs coming soon</div>
      <div id="tournaments" className="sr-only">Tournaments coming soon</div>
    </main>
  );
}
