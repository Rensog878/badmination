"use client";

import { createContext, useContext } from "react";

/** "pending" until WebGL support is known on the client. */
export type StageMode = "pending" | "3d" | "fallback";

export type StageView = "video" | "3d";

export interface StageStatus {
  mode: StageMode;
  reducedMotion: boolean;
  stageView: StageView;
  setStageView: (view: StageView) => void;
}

export const StageContext = createContext<StageStatus>({
  mode: "pending",
  reducedMotion: false,
  stageView: "video",
  setStageView: () => {},
});

export function useStage() {
  return useContext(StageContext);
}
