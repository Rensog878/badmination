"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { startMatch } from "@/app/umpire/actions";

export default function StartMatchButton({ slug, matchId }: { slug: string; matchId: string }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  return (
    <div className="text-right">
      <button
        type="button"
        disabled={pending}
        onClick={() =>
          startTransition(async () => {
            const res = await startMatch(slug, matchId);
            if (res.ok) router.push(`/umpire/${slug}/${matchId}`);
            else setError(res.error);
          })
        }
        className="rounded-lg border border-court-green px-4 py-2 font-display text-xs font-semibold tracking-[0.18em] text-court-green uppercase hover:bg-court-green hover:text-black disabled:opacity-60"
      >
        {pending ? "Starting…" : "Start"}
      </button>
      {error && (
        <p role="alert" className="mt-1 text-xs text-muted">
          {error}
        </p>
      )}
    </div>
  );
}
