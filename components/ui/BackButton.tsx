"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

interface BackButtonProps {
  fallbackHref: string;
  label?: string;
  className?: string;
}

/**
 * Smart Back Button for mobile and desktop.
 * If previous navigation history exists within the same origin, clicking it returns
 * to the exact previous page (preserving scroll, filters, and tab state).
 * If the page was opened directly, it safely falls back to fallbackHref.
 */
export default function BackButton({ fallbackHref, label = "Back", className }: BackButtonProps) {
  const router = useRouter();
  const [canGoBack, setCanGoBack] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      // Check if user navigated here from within our application
      const hasHistory = window.history.length > 1;
      const isInternalReferrer =
        document.referrer && document.referrer.startsWith(window.location.origin);
      if (hasHistory && (isInternalReferrer || window.history.state !== null)) {
        setCanGoBack(true);
      }
    }
  }, []);

  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (canGoBack) {
      e.preventDefault();
      router.back();
    }
  };

  return (
    <Link
      href={fallbackHref}
      onClick={handleClick}
      aria-label={label}
      className={
        className ??
        "inline-flex min-h-11 items-center gap-2 font-display text-xs tracking-[0.15em] text-muted uppercase transition-colors hover:text-off-white"
      }
    >
      <ArrowLeft aria-hidden="true" className="size-4 shrink-0" />
      <span>{label}</span>
    </Link>
  );
}
