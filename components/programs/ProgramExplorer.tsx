"use client";

import { useState } from "react";
import ProgramCard from "@/components/programs/ProgramCard";
import { PROGRAM_FILTERS, PROGRAMS, type ProgramAudience } from "@/lib/content";

type Filter = ProgramAudience | "all";

/** Audience filter + program grid. Filtering is instant; the count is announced to screen readers. */
export default function ProgramExplorer() {
  const [filter, setFilter] = useState<Filter>("all");
  const visible = filter === "all" ? PROGRAMS : PROGRAMS.filter((p) => p.audience === filter);

  return (
    <div>
      <div role="group" aria-label="Filter programs" className="flex flex-wrap gap-2">
        {PROGRAM_FILTERS.map((f) => {
          const pressed = filter === f.value;
          return (
            <button
              key={f.value}
              type="button"
              aria-pressed={pressed}
              onClick={() => setFilter(f.value)}
              className={`px-4 py-2.5 font-display text-xs font-semibold tracking-[0.2em] uppercase transition-colors ${
                pressed
                  ? "bg-off-white text-black"
                  : "border border-off-white/15 text-muted hover:border-off-white/40 hover:text-off-white"
              }`}
            >
              {f.label}
            </button>
          );
        })}
      </div>
      <p aria-live="polite" className="sr-only">
        {`Showing ${visible.length} program${visible.length === 1 ? "" : "s"}`}
      </p>

      <ul className="mt-10 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {visible.map((program) => (
          <li key={program.id}>
            <ProgramCard program={program} index={PROGRAMS.indexOf(program)} />
          </li>
        ))}
      </ul>
    </div>
  );
}
