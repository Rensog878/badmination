/**
 * Badmination Modular Feature Flags
 * Controls visibility and enablement of tournament, coaching, and broadcast features.
 * All flags are toggleable and can be overridden via client settings or admin panel.
 */
export interface FeatureFlags {
  /** "Meet the coach" profile section and editorial philosophy. */
  coachProfile: boolean;
  /** Training programs + trial booking drawer with WhatsApp dispatch. */
  programs: boolean;
  /** Gallery, video highlights, and testimonials. */
  showcase: boolean;
  /** Live spectator cheer bar with particle animations. */
  stadiumCheerBar: boolean;
  /** Broadcast BWF score differential momentum waveform graph. */
  momentumWaveform: boolean;
  /** Interactive 2D BWF stadium arena floorplan and court radar. */
  arenaRadarFloorplan: boolean;
  /** Single-handed mobile thumb reach arc for court-side umpires. */
  singleHandThumbMode: boolean;
  /** Authentic acoustic shuttlecock cork sound effects and chimes. */
  soundEffects: boolean;
  /** Multi-court broadcast split-screen video wall (Dual / Quad). */
  multiCourtBroadcast: boolean;
  /** Mobile native-app bottom glass navigation dock. */
  mobileBottomNav: boolean;
}

export const FEATURES: FeatureFlags = {
  coachProfile: true,
  programs: true,
  showcase: true,
  stadiumCheerBar: true,
  momentumWaveform: true,
  arenaRadarFloorplan: true,
  singleHandThumbMode: true,
  soundEffects: true,
  multiCourtBroadcast: true,
  mobileBottomNav: true,
};
