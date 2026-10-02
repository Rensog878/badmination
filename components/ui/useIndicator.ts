"use client";

import { useLayoutEffect, useRef, useState, type CSSProperties } from "react";

/**
 * Sliding active-item highlight (tabs, filter pills) without an animation library.
 * Children mark themselves with `data-indicator={key}`; the returned style places one
 * absolutely-positioned element over the active child, and the `.indicator` CSS
 * transition glides it. `ready` is false until the first measurement, so callers can
 * style the active child directly for the first paint (and without JS).
 */
export function useIndicator<T extends HTMLElement>(activeKey: string, cover = false) {
  const ref = useRef<T>(null);
  const [style, setStyle] = useState<CSSProperties>({ opacity: 0 });
  const [ready, setReady] = useState(false);

  useLayoutEffect(() => {
    const container = ref.current;
    if (!container) return;

    const measure = () => {
      const el = container.querySelector<HTMLElement>(`[data-indicator="${CSS.escape(activeKey)}"]`);
      if (!el) return setStyle({ opacity: 0 });
      // `cover` = sit over the whole child (pill); otherwise follow it horizontally only (underline).
      setStyle({
        width: el.offsetWidth,
        height: cover ? el.offsetHeight : undefined,
        transform: `translate(${el.offsetLeft}px, ${cover ? el.offsetTop : 0}px)`,
      });
      setReady(true);
    };

    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(container);
    return () => observer.disconnect();
  }, [activeKey, cover]);

  return { ref, style, ready };
}
