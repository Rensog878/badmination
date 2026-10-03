"use client";

import { Fragment, useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { LiveStripMatch } from "@/lib/live/summary";

// ---- Settings ----
/** How often to refresh scores (ms). */
const POLL_MS = 15_000;
/** Most matches shown in the strip; the rest go behind "+N more" (links to all courts). */
const MAX_VISIBLE = 8;
/** Order: real matches before demo ones, then by court number. */
const byPriority = (x: LiveStripMatch, y: LiveStripMatch) =>
  Number(x.demo) - Number(y.demo) || (x.court ?? 99) - (y.court ?? 99);

/**
 * Home page "Live now" strip: compact score cards for every match in play
 * (Cricbuzz / BBC Sport style). Overlays the top of the hero under the header,
 * so the 3D stage never resizes. Renders nothing until something is live, and
 * only polls while the tab is visible.
 */
export default function LiveNowStrip() {
  const [matches, setMatches] = useState<LiveStripMatch[]>([]);

  useEffect(() => {
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | undefined;

    const load = async () => {
      if (document.visibilityState === "visible") {
        try {
          const res = await fetch("/api/live", { cache: "no-store" });
          if (res.ok && !cancelled) setMatches(((await res.json()) as { matches: LiveStripMatch[] }).matches);
        } catch {
          // Offline or server asleep: keep the last state and try again.
        }
      }
      if (!cancelled) timer = setTimeout(load, POLL_MS);
    };
    const onVisible = () => {
      if (document.visibilityState !== "visible") return;
      clearTimeout(timer);
      void load();
    };

    void load();
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      cancelled = true;
      clearTimeout(timer);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, []);

  if (matches.length === 0) return null;

  const sorted = [...matches].sort(byPriority);
  const visible = sorted.slice(0, MAX_VISIBLE);
  const hidden = sorted.length - visible.length;
  const slugs = [...new Set(matches.map((m) => m.slug))];
  // One tournament: its dashboard. Several: the combined /live page.
  const allHref = slugs.length > 1 ? "/live" : `/tournaments/${slugs[0]}/live`;
  const demo = matches.every((m) => m.demo);

  return (
    <section
      aria-label="Live matches"
      className="strip-in absolute inset-x-0 top-[calc(4rem+env(safe-area-inset-top))] z-30 border-y border-white/[0.08] bg-black/90 backdrop-blur-xl lg:top-[calc(5rem+env(safe-area-inset-top))] print:hidden"
    >
      <div className="mx-auto flex h-12 max-w-[1600px] items-center px-3 sm:px-8 lg:px-16">
        <p className="flex shrink-0 items-center gap-1.5 border-r border-white/10 pr-2.5 font-display text-xs font-bold tracking-[0.18em] sm:tracking-[0.2em] uppercase text-off-white sm:gap-2 sm:pr-4">
          <span aria-hidden="true" className="relative flex size-2">
            <span className="absolute inset-0 animate-ping rounded-full bg-court-green opacity-80 motion-reduce:animate-none" />
            <span className="relative size-2 rounded-full bg-court-green shadow-[0_0_8px_rgba(16,185,129,0.9)]" />
          </span>
          {demo ? "Demo" : "Live"}
        </p>

        {/* Center matches ticker: horizontally scrollable when there are multiple matches */}
        <ul className="flex h-full min-w-0 flex-1 snap-x overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden overscroll-x-contain">
          {visible.map((m) => (
            <li key={`${m.slug}-${m.id}`} className="shrink-0 snap-start border-r border-white/[0.08]">
              <Link
                href={`/tournaments/${m.slug}/live/${m.id}`}
                aria-label={`${m.demo ? "Demo match. " : ""}${m.court ? `Court ${m.court}, ` : ""}${m.event}. ${m.names.a} ${m.points.a}, ${m.names.b} ${m.points.b}. Games ${m.games.a}–${m.games.b}. Open scoreboard`}
                className="flex h-full items-center gap-2 px-2.5 text-sm whitespace-nowrap sm:gap-3.5 sm:px-4 transition-colors hover:bg-white/[0.06]"
              >
                <span className="font-display text-xs font-medium tracking-[0.12em] sm:tracking-[0.14em] text-muted uppercase">
                  {m.demo && !demo ? "Demo · " : ""}
                  {m.court ? `Ct ${m.court}` : m.event}
                </span>
                {/* Phones: a two-row mini scoreboard so doubles names fit. */}
                <span className="grid grid-cols-[auto_1fr_auto] items-center gap-x-1.5 text-xs leading-tight sm:hidden">
                  {(["a", "b"] as const).map((side) => (
                    <Fragment key={side}>
                      <Serve on={m.server === side} />
                      <span className="max-w-[7rem] truncate font-display font-semibold uppercase">{m.names[side]}</span>
                      <span key={`${side}${m.points[side]}`} className="score-tick pl-1.5 text-right font-display font-bold tabular-nums">
                        {m.points[side]}
                      </span>
                    </Fragment>
                  ))}
                </span>
                {/* Wider screens: one line, broadcast-ticker style. */}
                <span className="hidden items-center gap-3 sm:flex">
                  <Name match={m} side="a" />
                  <span className="flex items-center gap-1.5 rounded-md border border-white/10 bg-white/[0.08] px-2.5 py-0.5 font-display font-bold tabular-nums shadow-xs">
                    <span key={`a${m.points.a}`} className="score-tick inline-block">{m.points.a}</span>
                    <span aria-hidden="true" className="text-muted">–</span>
                    <span key={`b${m.points.b}`} className="score-tick inline-block">{m.points.b}</span>
                  </span>
                  <Name match={m} side="b" />
                  {(m.games.a > 0 || m.games.b > 0) && (
                    <span className="font-display text-xs font-medium text-muted tabular-nums">
                      G {m.games.a}–{m.games.b}
                    </span>
                  )}
                </span>
              </Link>
            </li>
          ))}
        </ul>

        {/* Pinned "All courts" button: ALWAYS docked on the right, NEVER cropped, NO swipe needed! */}
        <div className="flex shrink-0 h-full items-center border-l border-white/10 pl-1.5 sm:pl-3">
          <Link
            href={allHref}
            className="flex h-full items-center gap-1 sm:gap-1.5 px-2 font-display text-xs font-semibold sm:px-3 tracking-[0.12em] sm:tracking-[0.15em] whitespace-nowrap text-court-green uppercase hover:text-off-white transition-colors"
          >
            <span>{hidden > 0 ? `+${hidden} more` : "All courts"}</span>
            <ArrowRight aria-hidden="true" className="size-3.5 sm:size-4 shrink-0" />
          </Link>
        </div>
      </div>
    </section>
  );
}

function Name({ match, side }: { match: LiveStripMatch; side: "a" | "b" }) {
  return (
    <span className="flex items-center gap-1.5">
      {side === "a" && <Serve on={match.server === "a"} />}
      <span className="max-w-[11rem] truncate font-display font-semibold uppercase">{match.names[side]}</span>
      {side === "b" && <Serve on={match.server === "b"} />}
    </span>
  );
}

function Serve({ on }: { on: boolean }) {
  return <span aria-hidden="true" className={`size-1.5 shrink-0 rounded-full ${on ? "bg-court-green" : "bg-transparent"}`} />;
}
