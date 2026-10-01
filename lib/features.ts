/**
 * Product focus: the site is for running tournaments, told through the 3D
 * transition. Everything else is built but switched off here (not deleted);
 * flip a flag to bring a section back (home page, navigation and admin follow).
 */
export const FEATURES = {
  /** "Meet the coach" profile section. */
  coachProfile: false,
  /** Training programs + trial booking. */
  programs: false,
  /** Gallery and testimonials (home section and admin page). */
  showcase: false,
} as const;
