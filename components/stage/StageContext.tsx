"use client";

import { createContext, useContext } from "react";

/** "pending" until WebGL support is known on the client. */
export type StageMode = "pending" | "3d" | "fallback";

export interface StageStatus {
  mode: StageMode;
  reducedMotion: boolean;
}

export const StageContext = createContext<StageStatus>({ mode: "pending", reducedMotion: false });

export function useStage() {
  return useContext(StageContext);
}
