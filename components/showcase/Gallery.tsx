"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import type { GalleryCategory, GalleryImage } from "@/lib/showcase";

type Filter = GalleryCategory | "All";

/** SVG placeholders and remote (R2) uploads are served as-is; R2 already serves cached, immutable files. */
const isSvg = (src: string) => src.endsWith(".svg") || /^https?:\/\//.test(src);

function PlaceholderBadge() {
  return (
    <span className="absolute top-3 left-3 bg-black/80 px-2 py-1 font-display text-xs tracking-[0.2em] text-muted uppercase">
      Placeholder
    </span>
  );
}

/** Filterable masonry gallery with an accessible lightbox (native <dialog>: focus trap + Escape). */
export default function Gallery({ images }: { images: GalleryImage[] }) {
  const categories: Filter[] = ["All", ...Array.from(new Set(images.map((i) => i.category)))];
  const [filter, setFilter] = useState<Filter>("All");
  const [open, setOpen] = useState<number | null>(null);
  const dialog = useRef<HTMLDialogElement>(null);
  const opener = useRef<HTMLButtonElement | null>(null);

  const visible = filter === "All" ? images : images.filter((i) => i.category === filter);
  const current = open === null ? null : visible[open];

  const close = useCallback(() => dialog.current?.close(), []);
  const step = useCallback(
    (delta: number) => setOpen((i) => (i === null ? i : (i + delta + visible.length) % visible.length)),
    [visible.length],
  );

  useEffect(() => {
    const d = dialog.current;
    if (!d) return;
    if (open !== null && !d.open) {
      d.showModal();
      if (typeof window !== "undefined") {
        window.history.pushState({ galleryOpen: true }, "");
      }
    }
  }, [open]);

  useEffect(() => {
    const onPop = () => {
      if (open !== null && dialog.current?.open) {
        dialog.current.close();
      }
    };
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, [open]);

  useEffect(() => {
    const d = dialog.current;
    if (!d) return;
    const onClose = () => {
      setOpen(null);
      opener.current?.focus();
      if (typeof window !== "undefined" && window.history.state?.galleryOpen) {
        window.history.back();
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") step(1);
      if (e.key === "ArrowLeft") step(-1);
    };
    d.addEventListener("close", onClose);
    d.addEventListener("keydown", onKey);
    return () => {
      d.removeEventListener("close", onClose);
      d.removeEventListener("keydown", onKey);
    };
  }, [step]);

  return (
    <div>
      {categories.length > 2 && (
        <div role="group" aria-label="Filter photos" className="flex flex-wrap gap-2">
          {categories.map((c) => (
            <button
              key={c}
              type="button"
              aria-pressed={filter === c}
              onClick={() => setFilter(c)}
              className={`inline-flex min-h-11 items-center rounded-full px-4 py-2.5 font-display text-xs font-semibold tracking-[0.12em] uppercase transition-colors ${
                filter === c ? "bg-off-white text-black" : "border border-off-white/15 text-muted hover:text-off-white"
              }`}
            >
              {c}
            </button>
          ))}
        </div>
      )}

      <ul className="mt-8 columns-1 gap-4 sm:columns-2 lg:columns-3">
        {visible.map((img, i) => (
          <li key={img.src} className="mb-4 break-inside-avoid">
            <button
              type="button"
              onClick={(e) => {
                opener.current = e.currentTarget;
                setOpen(i);
              }}
              className="group relative block w-full overflow-hidden rounded-2xl border border-off-white/10 text-left"
              aria-label={`Open photo: ${img.caption ?? img.alt}`}
            >
              <Image
                src={img.src}
                alt={img.alt}
                width={img.width}
                height={img.height}
                sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                unoptimized={isSvg(img.src)}
                className="h-auto w-full transition-transform duration-700 group-hover:scale-[1.03] motion-reduce:transition-none"
              />
              {img.placeholder && <PlaceholderBadge />}
              {img.caption && (
                <span className="absolute inset-x-0 bottom-0 bg-linear-to-t from-black/90 to-transparent px-4 pt-10 pb-3 font-display text-xs tracking-[0.2em] uppercase">
                  {img.caption}
                  <span className="ml-2 text-court-green">{img.category}</span>
                </span>
              )}
            </button>
          </li>
        ))}
      </ul>

      <dialog
        ref={dialog}
        aria-label={current ? `Photo: ${current.caption ?? current.alt}` : "Photo viewer"}
        className="m-auto max-h-none max-w-none bg-transparent p-0 text-off-white backdrop:bg-black/90"
        onClick={(e) => {
          if (e.target === e.currentTarget) close();
        }}
      >
        {current && (
          <figure className="relative flex max-h-[90svh] w-[min(92vw,1100px)] flex-col">
            <div className="relative min-h-0 flex-1">
              <Image
                src={current.src}
                alt={current.alt}
                width={current.width}
                height={current.height}
                sizes="92vw"
                unoptimized={isSvg(current.src)}
                className="mx-auto h-auto max-h-[78svh] w-auto object-contain"
              />
            </div>
            <figcaption className="mt-4 flex items-center justify-between gap-4">
              <span className="font-display text-sm tracking-[0.18em] uppercase">
                {current.caption}
                {current.placeholder && <span className="ml-3 text-muted">· Placeholder</span>}
                <span className="ml-3 text-muted tabular-nums">
                  {(open ?? 0) + 1} / {visible.length}
                </span>
              </span>
              <span className="flex gap-2">
                <button type="button" onClick={() => step(-1)} aria-label="Previous photo" className="inline-flex size-11 items-center justify-center border border-off-white/20 hover:border-court-green">
                  <ChevronLeft aria-hidden="true" className="size-5" />
                </button>
                <button type="button" onClick={() => step(1)} aria-label="Next photo" className="inline-flex size-11 items-center justify-center border border-off-white/20 hover:border-court-green">
                  <ChevronRight aria-hidden="true" className="size-5" />
                </button>
                <button type="button" onClick={close} aria-label="Close" autoFocus className="inline-flex size-11 items-center justify-center border border-off-white/20 hover:border-court-green">
                  <X aria-hidden="true" className="size-5" />
                </button>
              </span>
            </figcaption>
          </figure>
        )}
      </dialog>
    </div>
  );
}
