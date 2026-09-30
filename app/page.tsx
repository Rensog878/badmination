import HeroSection from "@/components/hero/HeroSection";

export default function Home() {
  return (
    <main className="relative">
      <HeroSection />
      {/* Phase 3: scroll space for the smash sequence. Intentionally empty. */}
      <section id="smash" aria-hidden="true" className="relative min-h-[300vh]" />
      {/* Placeholder anchors for the hero CTAs (built in later phases). */}
      <div id="programs" className="sr-only">Programs coming soon</div>
      <div id="tournaments" className="sr-only">Tournaments coming soon</div>
    </main>
  );
}
