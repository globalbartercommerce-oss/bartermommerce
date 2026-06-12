/**
 * Resource Route: File Upload to Cloudflare R2
 * POST /resources/upload
 * Accepts multipart/form-data with image files
 * Returns JSON: { urls: string[], keys: string[] }
 */

import {
  type ActionFunction,
  json,
  unstable_parseMultipartFormData,
  unstable_createMemoryUploadHandler,
} from "@remix-run/node";
import { requireUserId } from "~/utils/auth.server";
import { uploadToR2, isR2Configured, type R2Folder } from "~/utils/r2.server";

// Max 10MB per file, up to 5 files
const MAX_FILE_SIZE = 10 * 1024 * 1024;
const MAX_FILES = 5;
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif", "image/avif"];

export const action: ActionFunction = async ({ request }) => {
  // Auth check
  await requireUserId(request);

  // If R2 not configured, return mock URL (development fallback)
  if (!isR2Configured()) {
    console.warn("[Upload] R2 not configured — returning placeholder URLs");
    const formData = await request.formData();
    const files = formData.getAll("files");
    const urls = files.map(
      (_, i) => `https://picsum.photos/seed/${Date.now() + i}/800/600`
    );
    return json({ urls, keys: [], fallback: true });
  }

  // Parse multipart form with memory handler
  const uploadHandler = unstable_createMemoryUploadHandler({
    maxPartSize: MAX_FILE_SIZE,
  });

  let formData: FormData;
  try {
    formData = await unstable_parseMultipartFormData(request, uploadHandler);
  } catch (error: any) {
    return json(
      { error: `Upload failed: ${error.message}` },
      { status: 400 }
    );
  }

  const folder = (formData.get("folder") as R2Folder | null) ?? "listings";
  const files = formData.getAll("files") as File[];

  if (!files || files.length === 0) {
    return json({ error: "No files provided" }, { status: 400 });
  }

  if (files.length > MAX_FILES) {
    return json(
      { error: `Too many files. Maximum ${MAX_FILES} files per upload.` },
      { status: 400 }
    );
  }

  // Validate each file
  for (const file of files) {
    if (!ALLOWED_TYPES.includes(file.type)) {
      return json(
        { error: `Invalid file type: ${file.type}. Allowed: ${ALLOWED_TYPES.join(", ")}` },
        { status: 400 }
      );
    }
    if (file.size > MAX_FILE_SIZE) {
      return json(
        { error: `File ${file.name} exceeds 10MB limit` },
        { status: 400 }
      );
    }
  }

  // Upload all files to R2
  const results = await Promise.all(
    files.map(async (file) => {
      const buffer = Buffer.from(await file.arrayBuffer());
      return uploadToR2(buffer, file.name, folder);
    })
  );

  return json({
    urls: results.map((r) => r.url),
    keys: results.map((r) => r.key),
    sizes: results.map((r) => r.size),
  });
};

// GET not allowed
export const loader = () => json({ error: "Method not allowed" }, { status: 405 });
