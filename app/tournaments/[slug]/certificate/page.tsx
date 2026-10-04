import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { findTournament } from "@/lib/data/tournaments";
import TournamentCertificate from "@/components/certificates/TournamentCertificate";
import type { CertificateType } from "@/lib/certificates";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{
    name?: string;
    type?: string;
    event?: string;
    ref?: string;
    club?: string;
  }>;
};

export async function generateMetadata({ params, searchParams }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const { name } = await searchParams;
  const t = await findTournament(slug);
  return {
    title: t
      ? `Official Certificate · ${name || "Athlete"} · ${t.name} | Badmination`
      : "Tournament Certificate",
    description: "Official Badmination championship merit and participation certificate.",
  };
}

export default async function CertificatePage({ params, searchParams }: PageProps) {
  const { slug } = await params;
  const { name, type, event, ref, club } = await searchParams;

  const t = await findTournament(slug);
  if (!t) notFound();

  const validTypes: CertificateType[] = ["winner", "runner_up", "semi_finalist", "participation"];
  const certType: CertificateType = validTypes.includes(type as CertificateType)
    ? (type as CertificateType)
    : "winner";

  return (
    <TournamentCertificate
      tournament={t}
      initialName={name || "Badminton Athlete"}
      initialType={certType}
      initialEvent={event || t.events[0]?.type || "Open Singles"}
      initialReference={ref || ""}
      initialClub={club || ""}
    />
  );
}
