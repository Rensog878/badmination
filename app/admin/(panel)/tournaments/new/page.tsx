import TournamentForm from "@/components/admin/TournamentForm";

export default function NewTournamentPage() {
  return (
    <div className="max-w-3xl">
      <h1 className="font-display text-4xl font-bold tracking-[-0.02em] uppercase">New tournament</h1>
      <div className="mt-8">
        <TournamentForm />
      </div>
    </div>
  );
}
