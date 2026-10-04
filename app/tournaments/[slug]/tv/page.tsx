import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { findTournament } from "@/lib/data/tournaments";
import { ensureFeed, getSnapshot } from "@/lib/live/store";
import ArenaTvDisplay from "@/components/live/ArenaTvDisplay";

export const metadata: Metadata = {
  title: "Arena Stadium TV Broadcast | Badmination",
  robots: { index: false, follow: false },
};

type PageProps = { params: Promise<{ slug: string }> };

export default async function ArenaTvPage({ params }: PageProps) {
  const { slug } = await params;
  const tournament = await findTournament(slug);
  if (!tournament) notFound();

  await ensureFeed(tournament);
  const snapshot = getSnapshot(tournament);

  return (
    <ArenaTvDisplay
      initial={snapshot}
      tournamentName={tournament.name}
      venue={tournament.venue}
      city={tournament.city}
    />
  );
}
