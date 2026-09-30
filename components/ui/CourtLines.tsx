import type { SVGProps } from "react";

/**
 * Badminton court markings (landscape, decimetres: 134 × 61).
 * Every path uses pathLength=1 so callers can animate stroke-dashoffset 1 → 0.
 */
export const COURT_LINE_PATHS = [
  "M0.5 0.5H133.5V60.5H0.5Z", // doubles boundary
  "M0.5 5.1H133.5", // singles sideline
  "M0.5 55.9H133.5", // singles sideline
  "M8.1 0.5V60.5", // doubles long service line
  "M125.9 0.5V60.5", // doubles long service line
  "M47.2 0.5V60.5", // short service line
  "M86.8 0.5V60.5", // short service line
  "M0.5 30.5H47.2", // centre line
  "M86.8 30.5H133.5", // centre line
  "M67 -2V63", // net
] as const;

interface CourtLinesProps extends SVGProps<SVGSVGElement> {
  strokeWidth?: number;
  /** 0..1 portion of each line drawn. */
  progress?: number;
  pathClassName?: string;
}

export default function CourtLines({
  strokeWidth = 0.6,
  progress = 1,
  pathClassName,
  ...svgProps
}: CourtLinesProps) {
  return (
    <svg viewBox="-1 -3 136 67" fill="none" aria-hidden="true" {...svgProps}>
      {COURT_LINE_PATHS.map((d) => (
        <path
          key={d}
          d={d}
          pathLength={1}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          strokeDasharray="1 1"
          strokeDashoffset={1 - progress}
          className={pathClassName}
        />
      ))}
    </svg>
  );
}
