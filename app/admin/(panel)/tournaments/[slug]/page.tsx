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
        <div className="flex flex-wrap items-center gap-3 text-xs font-semibold">
          <Link
            href={`/tournaments/${t.slug}/print`}
            target="_blank"
            className="rounded-lg border border-off-white/20 bg-off-white/5 px-3 py-1.5 text-off-white hover:border-court-green/50 hover:text-court-green transition-all"
          >
            🖨️ Print Draws & Schedule
          </Link>
          <Link
            href={`/tournaments/${t.slug}/live`}
            target="_blank"
            className="rounded-lg border border-court-green/30 bg-court-green/10 px-3 py-1.5 text-court-green hover:bg-court-green hover:text-black transition-all"
          >
            Live Console
          </Link>
          <Link href={`/tournaments/${t.slug}`} className="text-muted hover:text-off-white underline underline-offset-4">
            View public page
          </Link>
        </div>
      </div>
      <div className="mt-8">
        <TournamentForm tournament={t} />
      </div>
      <form action={deleteTournamentAction} className="mt-16 border-t border-off-white/10 pt-6">
        <input type="hidden" name="slug" value={t.slug} />
        <p className="text-sm text-muted">Deleting removes the public pages. Registrations stay in the database.</p>
        <button type="submit" className="rounded-lg mt-3 border border-off-white/30 px-4 py-2 font-display text-xs font-semibold tracking-[0.18em] uppercase hover:border-off-white">
          Delete tournament
        </button>
      </form>
    </div>
  );
}
