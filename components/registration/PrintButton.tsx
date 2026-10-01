"use client";

import { Printer } from "lucide-react";

export default function PrintButton({ className = "" }: { className?: string }) {
  return (
    <button type="button" onClick={() => window.print()} className={className}>
      <Printer aria-hidden="true" className="size-4" />
      Print / save PDF
    </button>
  );
}
