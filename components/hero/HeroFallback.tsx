import CourtLines from "@/components/ui/CourtLines";

/**
 * Static hero visual used when WebGL is unavailable, the scene errors, or the
 * device is too slow. The headline and CTAs stay in HeroSection, so they are identical.
 */
export default function HeroFallback() {
  return (
    <div aria-hidden="true" className="absolute inset-0 overflow-hidden bg-black">
      <div className="absolute inset-x-0 bottom-0 h-[55%] [perspective:900px]">
        <CourtLines
          className="absolute bottom-[-10%] left-1/2 w-[140%] max-w-none text-off-white/20 [transform:translateX(-50%)_rotateX(62deg)] lg:w-[110%]"
          strokeWidth={0.3}
        />
      </div>
      <RacketSilhouette className="absolute top-[6%] left-1/2 h-[46%] -translate-x-1/2 rotate-[-38deg] lg:top-[10%] lg:left-auto lg:right-[14%] lg:h-[78%] lg:translate-x-0 lg:rotate-[-22deg]" />
    </div>
  );
}

function RacketSilhouette({ className }: { className?: string }) {
  const strings = Array.from({ length: 9 }, (_, i) => i);
  return (
    <svg viewBox="0 0 100 300" fill="none" className={className}>
      <defs>
        <clipPath id="fallback-head">
          <path d="M50 8C78 8 92 22 92 52C92 82 76 104 50 104C24 104 8 82 8 52C8 22 22 8 50 8Z" />
        </clipPath>
      </defs>
      <g clipPath="url(#fallback-head)" stroke="#F3F4F6" strokeOpacity="0.28" strokeWidth="0.6">
        {strings.map((i) => (
          <line key={`m${i}`} x1={14 + i * 9} y1="0" x2={14 + i * 9} y2="110" />
        ))}
        {strings.map((i) => (
          <line key={`c${i}`} x1="0" y1={16 + i * 10} x2="100" y2={16 + i * 10} />
        ))}
      </g>
      <path
        d="M50 5C80 5 95 20 95 52C95 84 78 107 50 107C22 107 5 84 5 52C5 20 20 5 50 5Z"
        stroke="#F3F4F6"
        strokeWidth="3.2"
      />
      <path d="M35 104L50 130L65 104" stroke="#F3F4F6" strokeWidth="2.6" strokeLinejoin="round" />
      <path d="M26 30L22 40M74 30L78 40" stroke="#10B981" strokeWidth="3.4" />
      <path d="M50 130V206" stroke="#F3F4F6" strokeWidth="2" />
      <rect x="45" y="206" width="10" height="84" rx="1.5" fill="#F3F4F6" fillOpacity="0.14" stroke="#F3F4F6" strokeWidth="1.2" />
      <path d="M45 212h10M45 224h10M45 236h10M45 248h10M45 260h10M45 272h10" stroke="#F3F4F6" strokeOpacity="0.35" strokeWidth="0.8" />
      <rect x="44" y="290" width="12" height="5" rx="1" fill="#10B981" />
    </svg>
  );
}
