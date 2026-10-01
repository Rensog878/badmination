"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { requestUpload, saveMedia } from "@/app/admin/media-actions";
import FormField, { FieldError, inputClass } from "@/components/registration/FormField";

/** Upload: presigned URL from the server → PUT straight to R2 → record metadata. */
export default function MediaUploader() {
  const router = useRouter();
  const form = useRef<HTMLFormElement>(null);
  const [status, setStatus] = useState<{ kind: "idle" | "busy" | "done" | "error"; message?: string }>({ kind: "idle" });

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const file = fd.get("file");
    if (!(file instanceof File) || file.size === 0) {
      setStatus({ kind: "error", message: "Choose an image." });
      return;
    }
    setStatus({ kind: "busy", message: "Uploading…" });
    try {
      const bitmap = await createImageBitmap(file);
      const { width, height } = bitmap;
      bitmap.close();
      const ticket = await requestUpload({ contentType: file.type, size: file.size });
      if (!ticket.ok) throw new Error(ticket.error);
      const put = await fetch(ticket.url, { method: "PUT", body: file, headers: { "Content-Type": file.type } });
      if (!put.ok) throw new Error(`Upload failed (${put.status}). Check the bucket's CORS settings.`);
      const saved = await saveMedia({
        key: ticket.key,
        alt: String(fd.get("alt") ?? ""),
        caption: String(fd.get("caption") ?? ""),
        category: String(fd.get("category") ?? ""),
        width,
        height,
      });
      if (!saved.ok) throw new Error(saved.error);
      form.current?.reset();
      setStatus({ kind: "done", message: "Photo added to the gallery." });
      router.refresh();
    } catch (err) {
      setStatus({ kind: "error", message: err instanceof Error ? err.message : "Upload failed." });
    }
  };

  return (
    <form ref={form} onSubmit={onSubmit} className="grid gap-5 sm:grid-cols-2">
      <FormField id="file" label="Image (JPEG, PNG, WebP, AVIF · max 8 MB)" className="sm:col-span-2">
        <input id="file" name="file" type="file" accept="image/jpeg,image/png,image/webp,image/avif" required className="rounded-lg block w-full text-sm file:mr-4 file:border-0 file:bg-off-white file:px-4 file:py-2 file:font-display file:text-xs file:font-semibold file:tracking-[0.15em] file:text-black file:uppercase" />
      </FormField>
      <FormField id="alt" label="Alt text" hint="Describe what's in the photo for screen-reader users." className="sm:col-span-2">
        <input id="alt" name="alt" required minLength={5} maxLength={200} className={inputClass} aria-describedby="alt-hint" />
      </FormField>
      <FormField id="caption" label="Caption" optional>
        <input id="caption" name="caption" maxLength={80} className={inputClass} />
      </FormField>
      <FormField id="category" label="Category">
        <select id="category" name="category" className={`${inputClass} bg-charcoal`} defaultValue="Training">
          <option>Training</option>
          <option>Tournaments</option>
          <option>Academy</option>
        </select>
      </FormField>
      <div className="sm:col-span-2" aria-live="polite">
        {status.kind === "error" && status.message && <FieldError message={status.message} />}
        {(status.kind === "busy" || status.kind === "done") && <p className="text-sm text-court-green">{status.message}</p>}
        <button type="submit" disabled={status.kind === "busy"} className="rounded-lg mt-3 bg-court-green px-6 py-3 font-display text-xs font-semibold tracking-[0.18em] text-black uppercase hover:bg-off-white disabled:opacity-60">
          Upload photo
        </button>
      </div>
    </form>
  );
}
