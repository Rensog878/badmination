import type { ReactNode } from "react";

/** Remounts on every admin navigation, so each page gets a short fade-in (CSS, off under reduced motion). */
export default function AdminTemplate({ children }: { children: ReactNode }) {
  return <div className="page-in">{children}</div>;
}
