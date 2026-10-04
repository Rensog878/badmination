/**
 * Official Badmination Tournament Certificate Engine.
 * Supports Champion (Gold), Runner-Up (Silver), Semi-Finalist (Bronze),
 * and Official Participation Merit certificates with high-resolution export.
 */

export type CertificateType = "winner" | "runner_up" | "semi_finalist" | "participation";

export interface CertificateData {
  recipientName: string;
  tournamentName: string;
  tournamentCity: string;
  tournamentVenue: string;
  dates: string;
  event: string;
  type: CertificateType;
  reference?: string;
  clubOrAffiliation?: string;
  issuedDate?: string;
  certNumber: string;
}

export const CERTIFICATE_CONFIG: Record<
  CertificateType,
  {
    title: string;
    subtitle: string;
    accentColor: string;
    badgeText: string;
    ribbonColor: string;
    medalColor: string;
    rankLabel: string;
  }
> = {
  winner: {
    title: "CERTIFICATE OF MERIT & EXCELLENCE",
    subtitle: "Proudly presented in recognition of supreme athletic prowess and crowned",
    accentColor: "#D4AF37", // Gold
    badgeText: "CHAMPION & GOLD MEDALIST",
    ribbonColor: "rgba(212, 175, 55, 0.15)",
    medalColor: "#F59E0B",
    rankLabel: "Champion",
  },
  runner_up: {
    title: "CERTIFICATE OF MERIT & DISTINCTION",
    subtitle: "Proudly presented in recognition of exceptional competitive achievement as",
    accentColor: "#C0C0C0", // Silver
    badgeText: "RUNNER-UP & SILVER MEDALIST",
    ribbonColor: "rgba(192, 192, 192, 0.15)",
    medalColor: "#9CA3AF",
    rankLabel: "Runner-Up",
  },
  semi_finalist: {
    title: "CERTIFICATE OF MERIT & DISTINCTION",
    subtitle: "Proudly presented in recognition of exemplary semifinal performance as",
    accentColor: "#CD7F32", // Bronze
    badgeText: "SEMI-FINALIST & PODIUM FINISHER",
    ribbonColor: "rgba(205, 127, 50, 0.15)",
    medalColor: "#B45309",
    rankLabel: "Semi-Finalist",
  },
  participation: {
    title: "CERTIFICATE OF ATHLETIC PARTICIPATION",
    subtitle: "Proudly presented in recognition of spirited sportsmanship and active competition in",
    accentColor: "#10B981", // Emerald
    badgeText: "OFFICIAL TOURNAMENT CONTENDER",
    ribbonColor: "rgba(16, 185, 129, 0.15)",
    medalColor: "#10B981",
    rankLabel: "Participant",
  },
};

export function formatCertNumber(
  tournamentSlug: string,
  reference?: string,
  type: CertificateType = "participation"
): string {
  const cleanSlug = tournamentSlug.replace(/[^a-zA-Z0-9]/g, "").slice(0, 6).toUpperCase();
  const typeCode =
    type === "winner"
      ? "GLD"
      : type === "runner_up"
      ? "SLV"
      : type === "semi_finalist"
      ? "BRZ"
      : "PRT";
  const cleanRef = reference
    ? reference.replace(/[^a-zA-Z0-9]/g, "").slice(-6).toUpperCase()
    : Math.random().toString(36).substring(2, 8).toUpperCase();
  return `BM-${cleanSlug}-${typeCode}-${cleanRef}`;
}
