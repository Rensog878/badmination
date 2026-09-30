import Image from "next/image";
import CourtLines from "@/components/ui/CourtLines";
import { COACH_PORTRAIT_URL } from "@/lib/assets";
import { COACH_NAME } from "@/lib/content";

/** Portrait frame. Until a real photo is supplied, shows a designed placeholder (never a stock face). */
export default function CoachPortrait() {
  return (
    <figure className="relative aspect-[4/5] w-full overflow-hidden border border-off-white/10 bg-black">
      {COACH_PORTRAIT_URL ? (
        <Image
          src={COACH_PORTRAIT_URL}
          alt={`Portrait of ${COACH_NAME}`}
          fill
          sizes="(min-width: 1024px) 40vw, 100vw"
          className="object-cover grayscale-[35%]"
        />
      ) : (
        <PortraitPlaceholder />
      )}
      {/* Corner ticks: broadcast-frame detail. */}
      <span aria-hidden="true" className="absolute top-3 left-3 size-4 border-t border-l border-court-green" />
      <span aria-hidden="true" className="absolute right-3 bottom-3 size-4 border-r border-b border-court-green" />
      <figcaption className="absolute inset-x-0 bottom-0 flex items-end justify-between bg-linear-to-t from-black/90 to-transparent px-5 pt-16 pb-5">
        <span className="font-display text-lg font-bold tracking-[0.02em] uppercase">{COACH_NAME}</span>
        <span className="font-display text-[0.65rem] tracking-[0.3em] text-court-green uppercase">Head coach</span>
      </figcaption>
    </figure>
  );
}

function PortraitPlaceholder() {
  return (
    <div aria-hidden="true" className="absolute inset-0">
      <CourtLines
        className="absolute top-1/2 left-1/2 w-[170%] max-w-none text-off-white/10 [transform:translate(-50%,-50%)_rotate(90deg)]"
        strokeWidth={0.3}
      />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_30%,rgba(16,185,129,0.14),transparent_65%)]" />
      <svg viewBox="0 0 200 250" className="absolute inset-x-0 bottom-0 mx-auto h-[82%]" fill="none">
        {/* Anonymous head-and-shoulders silhouette: no facial features. */}
        <ellipse cx="100" cy="78" rx="34" ry="40" fill="#141416" />
        <path d="M22 250C24 186 58 150 100 150C142 150 176 186 178 250Z" fill="#141416" />
        <path d="M66 78C66 55 81 38 100 38C119 38 134 55 134 78" stroke="#10B981" strokeOpacity="0.5" strokeWidth="1.2" />
        <path d="M30 250C33 192 62 158 100 158" stroke="#10B981" strokeOpacity="0.35" strokeWidth="1.2" />
      </svg>
      <p className="absolute top-6 left-0 w-full text-center font-display text-[0.65rem] tracking-[0.35em] text-muted uppercase">
        Portrait coming soon
      </p>
    </div>
  );
}
