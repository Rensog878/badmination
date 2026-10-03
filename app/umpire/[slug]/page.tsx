import type { Metadata } from "next";
import { findTournament } from "@/lib/data/tournaments";
import { notFound } from "next/navigation";
import UmpireShell from "@/components/umpire/UmpireShell";
import UmpireMatchList from "@/components/umpire/UmpireMatchList";
import { ensureFeed, getSnapshot } from "@/lib/live/store";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Umpire console", robots: { index: false, follow: false } };

type PageProps = { params: Promise<{ slug: string }> };

export default async function UmpireMatchesPage({ params }: PageProps) {
  const { slug } = await params;
  const t = await findTournament(slug);
  if (!t) notFound();

  // Always load real feed for umpire console
  await ensureFeed(t, { forceReal: true });
  const snapshot = getSnapshot(t);

  return (
    <UmpireShell slug={slug} next={`/umpire/${slug}`}>
      <UmpireMatchList slug={slug} initial={snapshot} />
    </UmpireShell>
  );
}
