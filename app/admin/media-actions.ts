"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import type { FormState } from "@/app/admin/actions";
import { adminOrError } from "@/lib/admin/guard";
import { addMedia, addTestimonial, removeMedia, removeTestimonial } from "@/lib/data/showcase";
import type { GalleryCategory } from "@/lib/showcase";
import { deleteObject, presignUpload, publicUrlFor, r2Config } from "@/lib/storage/r2";

const MAX_BYTES = 8 * 1024 * 1024;
const TYPES: Record<string, string> = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp", "image/avif": "avif" };
const CATEGORIES: GalleryCategory[] = ["Training", "Tournaments", "Academy"];

export type UploadTicket = { ok: true; url: string; key: string } | { ok: false; error: string };

/** Step 1: validate the file's type/size and hand back a 5-minute presigned PUT URL. */
export async function requestUpload(input: { contentType: string; size: number }): Promise<UploadTicket> {
  const auth = await adminOrError();
  if ("error" in auth) return { ok: false, error: auth.error };
  if (!r2Config()) return { ok: false, error: "Media storage isn't configured (R2_* variables)." };
  const ext = TYPES[input.contentType];
  if (!ext) return { ok: false, error: "Use JPEG, PNG, WebP or AVIF images." };
  if (!Number.isInteger(input.size) || input.size <= 0 || input.size > MAX_BYTES) return { ok: false, error: "Images must be under 8 MB." };
  const key = `gallery/${new Date().getFullYear()}/${randomUUID()}.${ext}`;
  return { ok: true, url: await presignUpload(key, input.contentType, input.size), key };
}

/** Step 2: after the browser's PUT succeeds, record the image. */
export async function saveMedia(input: {
  key: string;
  alt: string;
  caption: string;
  category: string;
  width: number;
  height: number;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const auth = await adminOrError();
  if ("error" in auth) return { ok: false, error: auth.error };
  if (!/^gallery\/\d{4}\/[0-9a-f-]{36}\.(jpg|png|webp|avif)$/.test(input.key)) return { ok: false, error: "Invalid upload key." };
  const alt = input.alt.trim();
  if (alt.length < 5) return { ok: false, error: "Describe the photo (alt text) for people using screen readers." };
  const category = CATEGORIES.find((c) => c === input.category);
  if (!category) return { ok: false, error: "Choose a category." };
  if (!(input.width > 0 && input.height > 0)) return { ok: false, error: "Couldn't read the image size." };
  await addMedia({
    key: input.key,
    url: publicUrlFor(input.key),
    alt: alt.slice(0, 200),
    caption: input.caption.trim().slice(0, 80),
    category,
    width: Math.round(input.width),
    height: Math.round(input.height),
    createdAt: new Date(),
  });
  revalidatePath("/");
  revalidatePath("/admin/media");
  return { ok: true };
}

export async function deleteMediaAction(fd: FormData) {
  const auth = await adminOrError();
  if ("error" in auth) return;
  const removed = await removeMedia(String(fd.get("id") ?? ""));
  if (removed) await deleteObject(removed.key);
  revalidatePath("/");
  revalidatePath("/admin/media");
}

export async function createTestimonialAction(_prev: FormState, fd: FormData): Promise<FormState> {
  const auth = await adminOrError();
  if ("error" in auth) return { error: auth.error };
  const quote = String(fd.get("quote") ?? "").trim();
  const attribution = String(fd.get("attribution") ?? "").trim();
  const context = String(fd.get("context") ?? "").trim();
  const fieldErrors: Record<string, string> = {};
  if (quote.length < 10 || quote.length > 400) fieldErrors.quote = "Between 10 and 400 characters";
  if (attribution.length < 2) fieldErrors.attribution = "Who said it (as they agreed to be named)";
  if (fd.get("consent") !== "on") fieldErrors.consent = "Confirm the person agreed to be quoted";
  if (Object.keys(fieldErrors).length) return { fieldErrors, error: "Check the highlighted fields." };
  await addTestimonial({ quote, attribution: attribution.slice(0, 80), context: context.slice(0, 80), consent: true, createdAt: new Date() });
  revalidatePath("/");
  revalidatePath("/admin/media");
  return { ok: "Testimonial published." };
}

export async function deleteTestimonialAction(fd: FormData) {
  const auth = await adminOrError();
  if ("error" in auth) return;
  await removeTestimonial(String(fd.get("id") ?? ""));
  revalidatePath("/");
  revalidatePath("/admin/media");
}
