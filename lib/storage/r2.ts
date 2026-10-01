import "server-only";
import { DeleteObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

/**
 * Cloudflare R2 (S3-compatible) for gallery media: 10 GB free, no egress fees.
 * Browsers upload directly with a short-lived presigned PUT, so files never pass
 * through our server; the signature pins content type and exact size.
 */

const UPLOAD_TTL_SECONDS = 300;

interface R2Config {
  accountId: string;
  accessKeyId: string;
  secretAccessKey: string;
  bucket: string;
  /** Public base URL (r2.dev subdomain or custom domain), no trailing slash. */
  publicUrl: string;
}

export function r2Config(): R2Config | null {
  const { R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET, R2_PUBLIC_URL } = process.env;
  if (!R2_ACCOUNT_ID || !R2_ACCESS_KEY_ID || !R2_SECRET_ACCESS_KEY || !R2_BUCKET || !R2_PUBLIC_URL) return null;
  return {
    accountId: R2_ACCOUNT_ID,
    accessKeyId: R2_ACCESS_KEY_ID,
    secretAccessKey: R2_SECRET_ACCESS_KEY,
    bucket: R2_BUCKET,
    publicUrl: R2_PUBLIC_URL.replace(/\/+$/, ""),
  };
}

const g = globalThis as typeof globalThis & { __r2?: S3Client };

function client(c: R2Config): S3Client {
  g.__r2 ??= new S3Client({
    region: "auto",
    endpoint: process.env.R2_ENDPOINT ?? `https://${c.accountId}.r2.cloudflarestorage.com`,
    credentials: { accessKeyId: c.accessKeyId, secretAccessKey: c.secretAccessKey },
    forcePathStyle: Boolean(process.env.R2_ENDPOINT),
  });
  return g.__r2;
}

export async function presignUpload(key: string, contentType: string, size: number): Promise<string> {
  const c = r2Config();
  if (!c) throw new Error("R2 is not configured");
  return getSignedUrl(
    client(c),
    new PutObjectCommand({ Bucket: c.bucket, Key: key, ContentType: contentType, ContentLength: size, CacheControl: "public, max-age=31536000, immutable" }),
    { expiresIn: UPLOAD_TTL_SECONDS },
  );
}

export async function deleteObject(key: string): Promise<void> {
  const c = r2Config();
  if (!c) return;
  await client(c).send(new DeleteObjectCommand({ Bucket: c.bucket, Key: key }));
}

export const publicUrlFor = (key: string) => `${r2Config()?.publicUrl ?? ""}/${key}`;
