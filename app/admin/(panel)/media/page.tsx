import Image from "next/image";
import { deleteMediaAction, deleteTestimonialAction } from "@/app/admin/media-actions";
import MediaUploader from "@/components/admin/MediaUploader";
import TestimonialForm from "@/components/admin/TestimonialForm";
import { listMedia, listTestimonialDocs } from "@/lib/data/showcase";
import { r2Config } from "@/lib/storage/r2";

export default async function AdminMedia() {
  const [media, quotes] = await Promise.all([listMedia(), listTestimonialDocs()]);
  return (
    <div className="max-w-5xl">
      <h1 className="font-display text-4xl font-bold tracking-[-0.02em] uppercase">Gallery & quotes</h1>

      <section aria-labelledby="gallery-admin" className="mt-10">
        <h2 id="gallery-admin" className="font-display text-xl font-bold uppercase">Gallery</h2>
        {r2Config() ? (
          <div className="mt-6">
            <MediaUploader />
          </div>
        ) : (
          <p className="mt-4 border border-off-white/15 p-5 text-sm text-muted">
            Uploads need Cloudflare R2. Set R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET and R2_PUBLIC_URL (see .env.example).
          </p>
        )}
        <ul className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {media.map((m) => (
            <li key={m._id.toHexString()} className="border border-off-white/10">
              <Image src={m.url} alt={m.alt} width={m.width} height={m.height} sizes="(min-width: 1024px) 30vw, 50vw" className="aspect-[4/3] w-full object-cover" unoptimized />
              <div className="flex items-start justify-between gap-3 p-3 text-sm">
                <span>
                  {m.caption || <span className="text-muted">No caption</span>}
                  <span className="block text-xs text-muted">{m.category}</span>
                </span>
                <form action={deleteMediaAction}>
                  <input type="hidden" name="id" value={m._id.toHexString()} />
                  <button type="submit" aria-label={`Delete photo ${m.caption || m.alt}`} className="text-xs tracking-[0.18em] text-muted uppercase hover:text-off-white">
                    Delete
                  </button>
                </form>
              </div>
            </li>
          ))}
        </ul>
        {media.length === 0 && <p className="mt-4 text-sm text-muted">No photos yet.</p>}
      </section>

      <section aria-labelledby="quotes-admin" className="mt-16">
        <h2 id="quotes-admin" className="font-display text-xl font-bold uppercase">Testimonials</h2>
        <div className="mt-6 max-w-2xl">
          <TestimonialForm />
        </div>
        <ul className="mt-8 divide-y divide-off-white/10 border-y border-off-white/10">
          {quotes.map((q) => (
            <li key={q._id.toHexString()} className="flex items-start justify-between gap-4 py-4">
              <blockquote>
                <p>“{q.quote}”</p>
                <footer className="mt-1 text-sm text-muted">
                  {q.attribution}
                  {q.context ? ` · ${q.context}` : ""}
                </footer>
              </blockquote>
              <form action={deleteTestimonialAction}>
                <input type="hidden" name="id" value={q._id.toHexString()} />
                <button type="submit" aria-label={`Delete testimonial from ${q.attribution}`} className="text-xs tracking-[0.18em] text-muted uppercase hover:text-off-white">
                  Delete
                </button>
              </form>
            </li>
          ))}
          {quotes.length === 0 && <li className="py-4 text-sm text-muted">No testimonials yet.</li>}
        </ul>
      </section>
    </div>
  );
}
