import { useEffect, useState } from "react";

const SOLID_AFTER_PX = 40;
const HIDE_AFTER_PX = 160;
const DIRECTION_THRESHOLD_PX = 6; // ignore scroll jitter

/**
 * `solid`: page has scrolled, so the header gets a backing.
 * `hidden`: user is scrolling down (the cinematic sequence stays unobstructed);
 * any upward scroll brings the header back.
 */
export function useHeaderState(locked: boolean) {
  const [solid, setSolid] = useState(false);
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    let lastY = window.scrollY;
    let frame = 0;

    const update = () => {
      frame = 0;
      const y = window.scrollY;
      setSolid(y > SOLID_AFTER_PX);
      const delta = y - lastY;
      if (Math.abs(delta) < DIRECTION_THRESHOLD_PX) return;
      setHidden(delta > 0 && y > HIDE_AFTER_PX);
      lastY = y;
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };

    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (frame) cancelAnimationFrame(frame);
    };
  }, []);

  return { solid, hidden: hidden && !locked };
}

/** Which of the given anchors is currently in the middle band of the viewport. */
export function useActiveSection(hrefs: readonly string[]) {
  const [active, setActive] = useState<string | null>(null);

  useEffect(() => {
    const targets = hrefs
      .map((href) => document.getElementById(href.slice(1)))
      .filter((el): el is HTMLElement => el !== null);
    if (targets.length === 0) return;
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) setActive(`#${entry.target.id}`);
        }
      },
      { rootMargin: "-45% 0px -50% 0px" },
    );
    targets.forEach((t) => observer.observe(t));
    return () => observer.disconnect();
  }, [hrefs]);

  return active;
}
