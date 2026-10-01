import Gallery from "@/components/showcase/Gallery";
import Testimonials from "@/components/showcase/Testimonials";
import Reveal from "@/components/ui/Reveal";
import { getGallery, getTestimonials, SHOWCASE_INTRO } from "@/lib/showcase";

/** WIN: gallery + testimonials. Renders nothing until there is real (or, in dev, sample) content. */
export default function ShowcaseSection() {
  const images = getGallery();
  const testimonials = getTestimonials();
  if (images.length === 0 && testimonials.length === 0) return null;

  return (
    <section id="gallery" aria-labelledby="gallery-heading" className="relative scroll-mt-20 border-t border-off-white/10 bg-charcoal">
      <div className="mx-auto max-w-[1600px] px-4 py-24 sm:px-8 md:py-32 lg:px-16 lg:py-40">
        <Reveal stagger className="max-w-3xl">
          <p className="flex items-center gap-3 font-display text-xs font-medium tracking-[0.32em] text-court-green uppercase">
            <span aria-hidden="true" className="h-px w-8 bg-court-green" />
            {SHOWCASE_INTRO.chapter}
          </p>
          <h2
            id="gallery-heading"
            className="mt-6 font-display text-[clamp(2.5rem,6.5vw,5.5rem)] leading-[0.92] font-bold tracking-[-0.03em] uppercase"
          >
            {SHOWCASE_INTRO.headline}
          </h2>
          <p className="mt-6 max-w-xl text-base leading-relaxed text-muted sm:text-lg">{SHOWCASE_INTRO.lead}</p>
        </Reveal>

        {images.length > 0 && (
          <Reveal className="mt-14">
            <Gallery images={images} />
          </Reveal>
        )}

        {testimonials.length > 0 && (
          <div className="mt-24">
            <h3 className="font-display text-2xl font-bold tracking-[-0.01em] uppercase sm:text-3xl">What players say</h3>
            <Reveal className="mt-2">
              <Testimonials items={testimonials} />
            </Reveal>
          </div>
        )}
      </div>
    </section>
  );
}
