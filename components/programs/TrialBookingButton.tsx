"use client";

import { useState } from "react";
import { MessageSquare, Sparkles } from "lucide-react";
import CoachingBookingDrawer from "@/components/programs/CoachingBookingDrawer";

interface TrialBookingButtonProps {
  programName?: string;
  className?: string;
  label?: string;
  icon?: "sparkles" | "message";
}

export default function TrialBookingButton({
  programName,
  className,
  label = "Book a trial session",
  icon = "sparkles",
}: TrialBookingButtonProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className={
          className ||
          "rounded-xl relative inline-flex items-center justify-center gap-2.5 bg-court-green px-7 py-4 font-display text-sm font-bold tracking-[0.14em] text-black uppercase transition-all hover:bg-off-white hover:scale-[1.02] shadow-[0_0_20px_rgba(16,185,129,0.3)] active:scale-[0.98]"
        }
      >
        {icon === "sparkles" ? (
          <Sparkles aria-hidden="true" className="size-4 text-black" />
        ) : (
          <MessageSquare aria-hidden="true" className="size-4 text-black" />
        )}
        <span>{label}</span>
      </button>

      <CoachingBookingDrawer
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        defaultProgram={programName}
      />
    </>
  );
}
