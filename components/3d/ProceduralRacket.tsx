"use client";

import { useEffect, useMemo } from "react";
import { buildRacket, type RacketDetail } from "@/lib/racketGeometry";

interface ProceduralRacketProps {
  detail?: RacketDetail;
  castShadow?: boolean;
}

/** Racket in metres, butt at y = 0. RacketModel handles pivot and scale. */
export default function ProceduralRacket({ detail = "high", castShadow = false }: ProceduralRacketProps) {
  const racket = useMemo(() => buildRacket(detail), [detail]);

  useEffect(() => () => racket.dispose(), [racket]);

  return (
    <group>
      {racket.parts.map((part) => (
        <mesh
          key={part.key}
          geometry={part.geometry}
          material={part.material}
          castShadow={castShadow}
        />
      ))}
    </group>
  );
}
