// Shared client-side image upload helper (Cloudinary).
//
// Every image in the app — profile picture, shop logo, shop gallery — goes
// through this same hardened path so uploads reliably succeed:
//   1. Env check (cloud name + upload preset must be configured)
//   2. Size guard (reject files that would exceed Cloudinary's limits)
//   3. Downscale very large photos (e.g. 12MP phone shots) to a safe size so
//      the upload never times out or gets rejected
//   4. Upload to Cloudinary
//   5. Validate the returned secure URL before returning it
import { createImage } from "./cropImage";

/** Cloudinary's default unsigned-preset upload limit. */
const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;

/** Cap the longest image edge at this many pixels before uploading. */
const MAX_DIMENSION = 1920;

/**
 * Downscales an image so its longest edge is at most `maxDim` and re-encodes
 * it as JPEG (quality 0.85). Small images are returned unchanged.
 */
export async function downscaleImage(
  file: Blob | File,
  maxDim: number = MAX_DIMENSION
): Promise<Blob> {
  if (file.size < 1024 * 1024) return file; // small files are fine as-is
  if (!file.type.startsWith("image/")) return file;

  const url = URL.createObjectURL(file);
  try {
    let image: HTMLImageElement;
    try {
      image = await createImage(url);
    } catch {
      // Can't decode this file (e.g. iPhone HEIC) — upload it as-is so
      // Cloudinary's native format support can handle it.
      return file;
    }
    const scale = Math.min(1, maxDim / Math.max(image.width, image.height));
    if (scale === 1) return file; // already within the size budget

    const w = Math.max(1, Math.round(image.width * scale));
    const h = Math.max(1, Math.round(image.height * scale));

    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) return file;

    ctx.drawImage(image, 0, 0, w, h);
    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, "image/jpeg", 0.85)
    );
    return blob ?? file;
  } finally {
    URL.revokeObjectURL(url);
  }
}

/**
 * Uploads an image to Cloudinary and returns its public secure URL.
 * Throws a user-friendly Error on any failure (missing env, oversized file,
 * network/upload error, or missing response URL).
 */
export async function uploadImage(file: Blob | File): Promise<string> {
  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;
  if (!cloudName || !uploadPreset) {
    throw new Error("Cloudinary is not configured. Please contact the admin.");
  }

  if (file.size > MAX_UPLOAD_BYTES) {
    throw new Error("Image must be less than 10MB.");
  }

  const optimized = await downscaleImage(file);

  const data = new FormData();
  data.append("file", optimized);
  data.append("upload_preset", uploadPreset);

  const res = await fetch(
    `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
    { method: "POST", body: data }
  );
  if (!res.ok) {
    throw new Error("Failed to upload image. Please try again.");
  }

  const json = await res.json();
  if (!json || typeof json.secure_url !== "string" || !json.secure_url) {
    throw new Error("Upload failed. Please try again.");
  }
  return json.secure_url as string;
}
