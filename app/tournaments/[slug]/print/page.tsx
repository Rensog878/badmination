import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { findTournament } from "@/lib/data/tournaments";
import { ensureFeed, getSnapshot } from "@/lib/live/store";
import PrintViewClient from "@/app/tournaments/[slug]/print/PrintViewClient";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const t = await findTournament(slug);
  return {
    title: t ? `Print Order of Play & Draws · ${t.name} | Badmination` : "Tournament Print Station",
    description: "Official printable tournament draw sheets, bracket trees, and daily order of play schedules.",
  };
}

export default async function TournamentPrintPage({ params }: PageProps) {
  const { slug } = await params;
  const t = await findTournament(slug);
  if (!t) notFound();

  await ensureFeed(t);
  const snapshot = getSnapshot(t);

  return <PrintViewClient tournament={t} snapshot={snapshot} />;
}
