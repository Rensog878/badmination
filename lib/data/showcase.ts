import "server-only";
import { ObjectId } from "mongodb";
import { collection, dbConfigured } from "@/lib/db/mongo";
import { PLACEHOLDER_GALLERY, PLACEHOLDER_TESTIMONIALS, showPlaceholders, type GalleryCategory, type GalleryImage, type Testimonial } from "@/lib/showcase";

export interface MediaDoc {
  _id: ObjectId;
  key: string;
  url: string;
  alt: string;
  caption: string;
  category: GalleryCategory;
  width: number;
  height: number;
  createdAt: Date;
}

export interface TestimonialDoc {
  _id: ObjectId;
  quote: string;
  attribution: string;
  context: string;
  /** Admin confirmed the person agreed to be quoted. */
  consent: true;
  createdAt: Date;
}

export async function listMedia(): Promise<MediaDoc[]> {
  if (!dbConfigured()) return [];
  return (await collection<MediaDoc>("media")).find().sort({ createdAt: -1 }).toArray();
}

export async function addMedia(doc: Omit<MediaDoc, "_id">) {
  await (await collection<Omit<MediaDoc, "_id">>("media")).insertOne(doc);
}

export async function removeMedia(id: string): Promise<MediaDoc | null> {
  return (await collection<MediaDoc>("media")).findOneAndDelete({ _id: new ObjectId(id) });
}

export async function listTestimonialDocs(): Promise<TestimonialDoc[]> {
  if (!dbConfigured()) return [];
  return (await collection<TestimonialDoc>("testimonials")).find().sort({ createdAt: -1 }).toArray();
}

export async function addTestimonial(doc: Omit<TestimonialDoc, "_id">) {
  await (await collection<Omit<TestimonialDoc, "_id">>("testimonials")).insertOne(doc);
}

export async function removeTestimonial(id: string) {
  await (await collection<TestimonialDoc>("testimonials")).deleteOne({ _id: new ObjectId(id) });
}

/** Public gallery: real uploads first, then (dev / opt-in only) labelled placeholders. */
export async function getGallery(): Promise<GalleryImage[]> {
  const real = (await listMedia()).map<GalleryImage>((m) => ({
    src: m.url,
    alt: m.alt,
    width: m.width,
    height: m.height,
    category: m.category,
    caption: m.caption || undefined,
  }));
  return showPlaceholders() ? [...real, ...PLACEHOLDER_GALLERY] : real;
}

export async function getTestimonials(): Promise<Testimonial[]> {
  const real = (await listTestimonialDocs()).map<Testimonial>((t) => ({
    quote: t.quote,
    attribution: t.attribution,
    context: t.context || undefined,
  }));
  return showPlaceholders() ? [...real, ...PLACEHOLDER_TESTIMONIALS] : real;
}
