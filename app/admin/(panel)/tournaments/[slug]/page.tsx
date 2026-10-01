import Link from "next/link";
import { notFound } from "next/navigation";
import { deleteTournamentAction } from "@/app/admin/actions";
import TournamentForm from "@/components/admin/TournamentForm";
import { findTournament } from "@/lib/data/tournaments";

type PageProps = { params: Promise<{ slug: string }> };

export default async function EditTournamentPage({ params }: PageProps) {
  const t = await findTournament((await params).slug);
  if (!t) notFound();
  return (
    <div className="max-w-3xl">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <h1 className="font-display text-4xl font-bold tracking-[-0.02em] uppercase">{t.name}</h1>
        <Link href={`/tournaments/${t.slug}`} className="text-sm text-court-green underline underline-offset-4">
          View public page
        </Link>
      </div>
      <div className="mt-8">
        <TournamentForm tournament={t} />
      </div>
      <form action={deleteTournamentAction} className="mt-16 border-t border-off-white/10 pt-6">
        <input type="hidden" name="slug" value={t.slug} />
        <p className="text-sm text-muted">Deleting removes the public pages. Registrations stay in the database.</p>
        <button type="submit" className="mt-3 border border-off-white/30 px-4 py-2 font-display text-xs font-semibold tracking-[0.18em] uppercase hover:border-off-white">
          Delete tournament
        </button>
      </form>
    </div>
  );
}
