"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { LiveStripMatch } from "@/lib/live/summary";

const POLL_MS = 15_000;

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

  const slugs = [...new Set(matches.map((m) => m.slug))];
  const allHref = `/tournaments/${matches.find((m) => !m.demo)?.slug ?? slugs[0]}/live`;
  const demo = matches.every((m) => m.demo);

  return (
    <section
      aria-label="Live matches"
      className="strip-in absolute inset-x-0 top-[calc(4rem+env(safe-area-inset-top))] z-30 lg:top-[calc(5rem+env(safe-area-inset-top))] print:hidden"
    >
      <div className="mx-auto flex max-w-[1600px] items-center gap-3 pr-[env(safe-area-inset-right)] pl-[max(1rem,env(safe-area-inset-left))] sm:pl-8 lg:pl-16">
        <p className="flex shrink-0 items-center gap-2 font-display text-xs font-semibold tracking-[0.2em] uppercase">
          <span aria-hidden="true" className="relative flex size-2">
            <span className="absolute inset-0 animate-ping rounded-full bg-court-green opacity-75 motion-reduce:animate-none" />
            <span className="relative size-2 rounded-full bg-court-green" />
          </span>
          {demo ? "Demo" : "Live"}
        </p>

        <ul className="flex min-w-0 flex-1 snap-x gap-2 overflow-x-auto py-1 pr-4 [scrollbar-width:none] sm:pr-8 lg:pr-16">
          {matches.map((m) => (
            <li key={`${m.slug}-${m.id}`} className="shrink-0 snap-start">
              <Link
                href={`/tournaments/${m.slug}/live/${m.id}`}
                aria-label={`${m.demo ? "Demo match. " : ""}${m.court ? `Court ${m.court}, ` : ""}${m.names.a} ${m.points.a}, ${m.names.b} ${m.points.b}. Games ${m.games.a}–${m.games.b}. Open scoreboard`}
                className="flex min-h-11 w-60 flex-col justify-center rounded-lg border border-off-white/15 bg-black/80 px-3 py-2 transition-colors hover:border-court-green/60 active:scale-[0.98]"
              >
                <span className="mb-1 truncate text-[0.75rem] tracking-[0.12em] text-muted uppercase">
                  {m.demo && !demo ? "Demo · " : ""}
                  {m.court ? `Court ${m.court} · ` : ""}
                  {m.event}
                </span>
                {(["a", "b"] as const).map((side) => (
                  <span key={side} className="flex items-center gap-2 text-sm">
                    <span
                      aria-hidden="true"
                      className={`size-1.5 shrink-0 rounded-full ${m.server === side ? "bg-court-green" : "bg-transparent"}`}
                    />
                    <span className="min-w-0 flex-1 truncate font-display font-semibold uppercase">{m.names[side]}</span>
                    <span className="font-display text-xs text-muted tabular-nums">{m.games[side]}</span>
                    <span
                      key={m.points[side]}
                      className="score-tick w-6 text-right font-display font-bold tabular-nums"
                    >
                      {m.points[side]}
                    </span>
                  </span>
                ))}
              </Link>
            </li>
          ))}
          <li className="shrink-0 snap-start">
            <Link
              href={allHref}
              className="flex min-h-11 h-full items-center gap-2 rounded-lg px-3 font-display text-xs font-semibold tracking-[0.15em] whitespace-nowrap text-court-green uppercase hover:text-off-white"
            >
              All courts
              <ArrowRight aria-hidden="true" className="size-4" />
            </Link>
          </li>
        </ul>
      </div>
    </section>
  );
}
