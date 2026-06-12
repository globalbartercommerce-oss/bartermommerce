/**
 * Cloudflare R2 Storage Utility
 * S3-compatible Object Storage for Marketplace Images
 */

import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { createId } from "@paralleldrive/cuid2";

// ── R2 Client (S3-compatible) ──────────────────────────────
let r2Client: S3Client | null = null;

function getR2Client(): S3Client {
  if (r2Client) return r2Client;

  const endpoint = process.env.R2_ENDPOINT;
  const accessKeyId = process.env.R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;

  if (!endpoint || !accessKeyId || !secretAccessKey) {
    throw new Error(
      "R2 credentials not configured. Set R2_ENDPOINT, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY in .env"
    );
  }

  r2Client = new S3Client({
    region: "auto",
    endpoint,
    credentials: { accessKeyId, secretAccessKey },
  });

  return r2Client;
}

const BUCKET = () => {
  const bucket = process.env.R2_BUCKET_NAME;
  if (!bucket) throw new Error("R2_BUCKET_NAME not configured");
  return bucket;
};

const PUBLIC_URL = () => {
  const url = process.env.R2_PUBLIC_URL;
  if (!url) throw new Error("R2_PUBLIC_URL not configured");
  return url.replace(/\/$/, "");
};

// ── Types ──────────────────────────────────────────────────
export interface UploadResult {
  url: string;
  key: string;
  size: number;
}

export type R2Folder = "listings" | "businesses" | "avatars" | "documents";

// ── Utilities ──────────────────────────────────────────────
function generateKey(folder: R2Folder, filename: string): string {
  const ext = filename.split(".").pop()?.toLowerCase() || "bin";
  const id = createId();
  return `${folder}/${id}.${ext}`;
}

function getContentType(filename: string): string {
  const ext = filename.split(".").pop()?.toLowerCase();
  const types: Record<string, string> = {
    jpg: "image/jpeg",
    jpeg: "image/jpeg",
    png: "image/png",
    webp: "image/webp",
    gif: "image/gif",
    avif: "image/avif",
    svg: "image/svg+xml",
    pdf: "application/pdf",
  };
  return types[ext || ""] || "application/octet-stream";
}

// ── Main Functions ─────────────────────────────────────────

/**
 * Upload a file buffer to Cloudflare R2
 * @param buffer - File content as Buffer or Uint8Array
 * @param filename - Original filename (used for extension + content type)
 * @param folder - Logical folder in R2 bucket
 * @returns UploadResult with public URL and object key
 */
export async function uploadToR2(
  buffer: Buffer | Uint8Array,
  filename: string,
  folder: R2Folder = "listings"
): Promise<UploadResult> {
  const client = getR2Client();
  const key = generateKey(folder, filename);
  const contentType = getContentType(filename);

  await client.send(
    new PutObjectCommand({
      Bucket: BUCKET(),
      Key: key,
      Body: buffer,
      ContentType: contentType,
      CacheControl: "public, max-age=31536000, immutable",
    })
  );

  return {
    url: `${PUBLIC_URL()}/${key}`,
    key,
    size: buffer.byteLength,
  };
}

/**
 * Upload from URL (fetch external image → R2)
 */
export async function uploadFromUrl(
  url: string,
  folder: R2Folder = "listings"
): Promise<UploadResult> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch image from URL: ${url}`);
  }
  const buffer = Buffer.from(await response.arrayBuffer());
  const ext = url.split("?")[0].split(".").pop() || "jpg";
  return uploadToR2(buffer, `image.${ext}`, folder);
}

/**
 * Delete an object from R2 by key
 */
export async function deleteFromR2(key: string): Promise<void> {
  const client = getR2Client();
  await client.send(
    new DeleteObjectCommand({
      Bucket: BUCKET(),
      Key: key,
    })
  );
}

/**
 * Generate a temporary presigned URL for private assets
 * @param key - Object key in R2
 * @param expiresInSeconds - URL expiry (default: 1 hour)
 */
export async function getPresignedUrl(
  key: string,
  expiresInSeconds = 3600
): Promise<string> {
  const client = getR2Client();
  const command = new GetObjectCommand({
    Bucket: BUCKET(),
    Key: key,
  });
  return getSignedUrl(client, command, { expiresIn: expiresInSeconds });
}

/**
 * Parse multipart form upload from Remix Request
 * Returns array of UploadResult for all image files
 */
export async function handleMultipartUpload(
  request: Request,
  folder: R2Folder = "listings"
): Promise<UploadResult[]> {
  const formData = await request.formData();
  const results: UploadResult[] = [];

  for (const [, value] of formData.entries()) {
    if (value instanceof File && value.size > 0) {
      // Validate file type
      if (!value.type.startsWith("image/")) {
        throw new Error(`Invalid file type: ${value.type}. Only images allowed.`);
      }
      // Validate size (max 10MB)
      if (value.size > 10 * 1024 * 1024) {
        throw new Error(`File too large: ${value.name}. Maximum 10MB.`);
      }
      const buffer = Buffer.from(await value.arrayBuffer());
      const result = await uploadToR2(buffer, value.name, folder);
      results.push(result);
    }
  }

  return results;
}

/**
 * Check if R2 is configured (for graceful degradation)
 */
export function isR2Configured(): boolean {
  return !!(
    process.env.R2_ENDPOINT &&
    process.env.R2_ACCESS_KEY_ID &&
    process.env.R2_SECRET_ACCESS_KEY &&
    process.env.R2_BUCKET_NAME
  );
}
