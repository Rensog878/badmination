"use client";

import { useEffect, useState } from "react";
import type { LiveSnapshot } from "@/lib/live/types";

export type Connection = "connecting" | "live" | "reconnecting";

/** Subscribes to the SSE feed; starts from the server-rendered snapshot. */
export function useLiveFeed(slug: string, initial: LiveSnapshot) {
  const [snapshot, setSnapshot] = useState(initial);
  const [connection, setConnection] = useState<Connection>("connecting");

  useEffect(() => {
    const source = new EventSource(`/api/live/${encodeURIComponent(slug)}`);
    const onSnapshot = (event: MessageEvent<string>) => {
      try {
        setSnapshot(JSON.parse(event.data) as LiveSnapshot);
        setConnection("live");
      } catch {
        // Ignore a malformed frame; the next one replaces it.
      }
    };
    source.addEventListener("snapshot", onSnapshot);
    // EventSource retries automatically; just reflect the state.
    source.onerror = () => setConnection("reconnecting");
    return () => {
      source.removeEventListener("snapshot", onSnapshot);
      source.close();
    };
  }, [slug]);

  return { snapshot, connection };
}
