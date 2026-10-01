/**
 * Gallery/testimonial types and labelled placeholders. Real content is managed
 * in the admin (Gallery & quotes) and read via lib/data/showcase. Placeholders
 * are hidden in production unless SHOW_PLACEHOLDERS=1, so sample quotes or
 * artwork are never presented as real.
 */

export const showPlaceholders = () =>
  process.env.SHOW_PLACEHOLDERS === "1" || process.env.NODE_ENV !== "production";

export type GalleryCategory = "Training" | "Tournaments" | "Academy";

export interface GalleryImage {
  src: string;
  alt: string;
  width: number;
  height: number;
  category: GalleryCategory;
  caption?: string;
  placeholder?: boolean;
}

const placeholderImage = (
  id: string,
  category: GalleryCategory,
  width: number,
  height: number,
  caption: string,
): GalleryImage => ({
  src: `/gallery/placeholders/${id}.svg`,
  alt: `Placeholder artwork: court lines and a green shuttle trail (${caption.toLowerCase()})`,
  width,
  height,
  category,
  caption,
  placeholder: true,
});

export const PLACEHOLDER_GALLERY: GalleryImage[] = [
  placeholderImage("training-1", "Training", 1200, 1500, "Footwork drills"),
  placeholderImage("tournament-1", "Tournaments", 1200, 1200, "Finals day"),
  placeholderImage("academy-1", "Academy", 1600, 1000, "Junior squad"),
  placeholderImage("training-2", "Training", 1500, 1000, "Smash clinic"),
  placeholderImage("tournament-2", "Tournaments", 1200, 1600, "Prize giving"),
  placeholderImage("academy-2", "Academy", 1200, 1500, "Match practice"),
];

export interface Testimonial {
  quote: string;
  /** Who said it. Real entries need the person's consent to be named. */
  attribution: string;
  context?: string;
  placeholder?: boolean;
}

// Samples only: no names, clearly labelled, hidden in production.
export const PLACEHOLDER_TESTIMONIALS: Testimonial[] = [
  {
    quote: "Sessions are structured and demanding, and every drill has a reason. My footwork changed within a term.",
    attribution: "Sample testimonial",
    context: "Adult performance player",
    placeholder: true,
  },
  {
    quote: "Our child went from nervous in matches to enjoying the pressure. The match-play feedback made the difference.",
    attribution: "Sample testimonial",
    context: "Parent, junior development",
    placeholder: true,
  },
  {
    quote: "Clear plans before tournaments and honest video review afterwards. I finally understand why I win or lose points.",
    attribution: "Sample testimonial",
    context: "Elite squad player",
    placeholder: true,
  },
  {
    quote: "Well-run tournaments: schedules on time, live scores on the phone, and quick payouts.",
    attribution: "Sample testimonial",
    context: "Tournament entrant",
    placeholder: true,
  },
];

export const SHOWCASE_INTRO = {
  chapter: "06 — Win",
  // TODO: copy
  headline: "Moments from the court",
  lead: "Training floors, finals days and the players who made them.", // TODO: copy
} as const;
