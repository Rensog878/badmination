"use client";

import { useState } from "react";
import { GraduationCap } from "lucide-react";
import StudentCertificateModal from "@/components/registration/StudentCertificateModal";

interface StudentCertificateButtonProps {
  studentName: string;
  institution?: string;
  studentId?: string;
  tournamentName: string;
  tournamentCity: string;
  tournamentVenue: string;
  dates: string;
  events: string;
  reference: string;
}

export default function StudentCertificateButton({
  studentName,
  institution,
  studentId,
  tournamentName,
  tournamentCity,
  tournamentVenue,
  dates,
  events,
  reference,
}: StudentCertificateButtonProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center justify-center gap-2 rounded-lg border-2 border-court-green/60 bg-court-green/10 px-6 py-3.5 font-display text-xs font-bold tracking-[0.16em] text-court-green uppercase hover:bg-court-green hover:text-black transition-all shadow-md shadow-court-green/10 hover:shadow-court-green/30"
      >
        <GraduationCap className="size-4" />
        <span>Student Certificate of Participation</span>
      </button>

      <StudentCertificateModal
        isOpen={open}
        onClose={() => setOpen(false)}
        studentName={studentName}
        institution={institution}
        studentId={studentId}
        tournamentName={tournamentName}
        tournamentCity={tournamentCity}
        tournamentVenue={tournamentVenue}
        dates={dates}
        events={events}
        reference={reference}
      />
    </>
  );
}
