"use client";

import { useState } from "react";
import { X, ChevronDown, Check, Trophy, Users, User } from "lucide-react";

interface CategoryOption {
  id: string;
  label: string;
  type: "Singles" | "Doubles";
  ageGroup: string;
  playersCount?: number;
}

interface MobileCategorySheetProps {
  currentCategory: string;
  onSelectCategory: (cat: "singles" | "doubles") => void;
  currentRound: "quarters" | "semis" | "final";
  onSelectRound: (round: "quarters" | "semis" | "final") => void;
  quartersCount: number;
  semisCount: number;
}

export default function MobileCategorySheet({
  currentCategory,
  onSelectCategory,
  currentRound,
  onSelectRound,
  quartersCount,
  semisCount,
}: MobileCategorySheetProps) {
  const [isOpen, setIsOpen] = useState(false);

  const categories: CategoryOption[] = [
    {
      id: "singles",
      label: "Open Singles Championship",
      type: "Singles",
      ageGroup: "Open Division",
      playersCount: 8,
    },
    {
      id: "doubles",
      label: "Open Doubles Championship",
      type: "Doubles",
      ageGroup: "Open Division",
      playersCount: 8,
    },
  ];

  const triggerHaptic = () => {
    if (typeof navigator !== "undefined" && "vibrate" in navigator) {
      try {
        navigator.vibrate?.(15);
      } catch {
        // ignore
      }
    }
  };

  const handleCategoryPick = (catId: "singles" | "doubles") => {
    triggerHaptic();
    onSelectCategory(catId);
  };

  const handleRoundPick = (round: "quarters" | "semis" | "final") => {
    triggerHaptic();
    onSelectRound(round);
    setIsOpen(false);
  };

  return (
    <div className="block md:hidden">
      {/* Mobile Trigger Button */}
      <button
        type="button"
        onClick={() => {
          triggerHaptic();
          setIsOpen(true);
        }}
        className="flex w-full items-center justify-between rounded-xl border border-off-white/15 bg-black/60 px-4 py-3 backdrop-blur-md shadow-lg"
      >
        <div className="flex items-center gap-2.5">
          <span className="flex size-7 items-center justify-center rounded-lg bg-court-green/15 text-court-green border border-court-green/30">
            <Trophy className="size-3.5" />
          </span>
          <div className="text-left">
            <p className="font-display text-[10px] font-bold uppercase tracking-wider text-muted">
              Current Draw & Round
            </p>
            <p className="font-display text-xs font-bold uppercase text-off-white">
              {currentCategory === "singles" ? "Singles" : "Doubles"} ·{" "}
              <span className="text-court-green">
                {currentRound === "quarters" ? "Quarter-Finals" : currentRound === "semis" ? "Semi-Finals" : "Championship Final"}
              </span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1 text-xs font-bold uppercase text-court-green">
          <span>Filter</span>
          <ChevronDown className="size-4" />
        </div>
      </button>

      {/* Slide-Up Bottom Sheet Modal */}
      {isOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/80 backdrop-blur-sm animate-fade-in"
        >
          {/* Backdrop Click */}
          <div className="absolute inset-0" onClick={() => setIsOpen(false)} />

          {/* Sheet Panel */}
          <div className="relative z-10 w-full max-w-lg rounded-t-3xl border-t border-off-white/15 bg-charcoal p-6 pb-8 shadow-2xl animate-sheet-up">
            {/* Grab Handle */}
            <div className="mx-auto mb-4 h-1.5 w-12 rounded-full bg-off-white/20" />

            {/* Header */}
            <div className="flex items-center justify-between border-b border-off-white/10 pb-4">
              <div>
                <h3 className="font-display text-base font-black uppercase text-off-white">
                  Bracket Event & Round Selector
                </h3>
                <p className="text-xs text-muted">Switch tournament draws or jump straight to a stage</p>
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="flex size-8 items-center justify-center rounded-lg border border-off-white/10 bg-off-white/5 text-muted hover:text-off-white"
              >
                <X className="size-4" />
              </button>
            </div>

            {/* Category Selector Cards */}
            <div className="mt-5 space-y-2.5">
              <p className="text-[10px] font-bold uppercase tracking-wider text-muted">
                1. Select Championship Event
              </p>
              {categories.map((cat) => {
                const isSelected = currentCategory === cat.id;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => handleCategoryPick(cat.id as "singles" | "doubles")}
                    className={`flex w-full items-center justify-between rounded-xl border p-3.5 text-left transition-all ${
                      isSelected
                        ? "border-court-green bg-court-green/10 shadow-[0_0_16px_rgba(16,185,129,0.15)]"
                        : "border-off-white/10 bg-black/40 hover:border-off-white/20"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`flex size-9 items-center justify-center rounded-lg ${
                          isSelected ? "bg-court-green text-black" : "bg-off-white/10 text-muted"
                        }`}
                      >
                        {cat.type === "Singles" ? <User className="size-4" /> : <Users className="size-4" />}
                      </div>
                      <div>
                        <p className="font-display text-xs font-bold uppercase text-off-white">
                          {cat.label}
                        </p>
                        <p className="text-[11px] text-muted">
                          {cat.ageGroup} · {cat.playersCount} Players
                        </p>
                      </div>
                    </div>
                    {isSelected && <Check className="size-4 text-court-green" />}
                  </button>
                );
              })}
            </div>

            {/* Stage / Round Quick Jump */}
            <div className="mt-6 border-t border-off-white/10 pt-4">
              <p className="text-[10px] font-bold uppercase tracking-wider text-muted mb-2.5">
                2. Jump to Stage
              </p>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => handleRoundPick("quarters")}
                  className={`rounded-xl border p-3 text-center transition-all ${
                    currentRound === "quarters"
                      ? "border-court-green bg-court-green/15 text-court-green font-bold shadow-md"
                      : "border-off-white/10 bg-black/40 text-muted hover:text-off-white"
                  }`}
                >
                  <p className="font-display text-xs font-bold uppercase">Quarters</p>
                  <p className="text-[10px] text-muted">{quartersCount} Matches</p>
                </button>

                <button
                  type="button"
                  onClick={() => handleRoundPick("semis")}
                  className={`rounded-xl border p-3 text-center transition-all ${
                    currentRound === "semis"
                      ? "border-court-green bg-court-green/15 text-court-green font-bold shadow-md"
                      : "border-off-white/10 bg-black/40 text-muted hover:text-off-white"
                  }`}
                >
                  <p className="font-display text-xs font-bold uppercase">Semis</p>
                  <p className="text-[10px] text-muted">{semisCount} Matches</p>
                </button>

                <button
                  type="button"
                  onClick={() => handleRoundPick("final")}
                  className={`rounded-xl border p-3 text-center transition-all ${
                    currentRound === "final"
                      ? "border-amber-400 bg-amber-400/15 text-amber-300 font-bold shadow-[0_0_12px_rgba(234,179,8,0.2)]"
                      : "border-off-white/10 bg-black/40 text-muted hover:text-off-white"
                  }`}
                >
                  <p className="font-display text-xs font-bold uppercase">Final</p>
                  <p className="text-[10px] text-amber-400/80">Gold Decider</p>
                </button>
              </div>
            </div>

            {/* Dismiss Button */}
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="mt-6 w-full rounded-xl bg-off-white/10 py-3 font-display text-xs font-bold uppercase tracking-wider text-off-white hover:bg-off-white/20 transition-colors"
            >
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
