import CourtLines from "@/components/ui/CourtLines";

/** Static smash composition for devices without WebGL: court, shuttle and its speed trail. */
export default function SmashFallback() {
  return (
    <div aria-hidden="true" className="absolute inset-0 overflow-hidden bg-black">
      <div className="absolute inset-x-0 bottom-0 h-[60%] [perspective:900px]">
        <CourtLines
          className="absolute bottom-[-10%] left-1/2 w-[140%] max-w-none text-off-white/15 [transform:translateX(-50%)_rotateX(62deg)] lg:w-[110%]"
          strokeWidth={0.3}
        />
      </div>
      <svg viewBox="0 0 1000 600" preserveAspectRatio="xMidYMid slice" className="absolute inset-0 h-full w-full">
        <defs>
          <linearGradient id="smash-trail" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#10B981" stopOpacity="0" />
            <stop offset="1" stopColor="#10B981" stopOpacity="0.9" />
          </linearGradient>
        </defs>
        <path d="M760 60 Q560 220 300 470" stroke="url(#smash-trail)" strokeWidth="5" fill="none" strokeLinecap="round" />
        <path d="M760 60 Q560 220 300 470" stroke="#F3F4F6" strokeOpacity="0.5" strokeWidth="1.2" fill="none" />
        <g transform="translate(300 470) rotate(-140)">
          <path d="M0 0 L-9 26 L9 26 Z" fill="#F3F4F6" fillOpacity="0.85" />
          <circle cx="0" cy="-2" r="5" fill="#F3F4F6" />
        </g>
      </svg>
    </div>
  );
}
