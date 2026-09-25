/**
 * Server-side image uploads for admin CRUD (products, collections) into
 * Vercel Blob (`brike-media`, public read).
 *
 * Security (securly): validation happens HERE, on the server — the browser's
 * accept= filter is cosmetic. We sniff magic bytes instead of trusting the
 * client-declared MIME type, cap size, and only ever store raster formats
 * (no SVG — uploaded markup could execute when opened as a document).
 *
 * Auth: BLOB_READ_WRITE_TOKEN exists in every Vercel env and in .env.local
 * (added via `vercel storage update --add-rw-token`, alongside OIDC vars), so
 * @vercel/blob picks the token up from the environment on every surface.
 */
import { del, put } from "@vercel/blob";

export const MAX_UPLOAD_BYTES = 2 * 1024 * 1024; // 2 MB

/**
 * User-safe upload rejection (bad type/size). Actions surface `message`
 * verbatim to the admin; unexpected errors (network, blob token) stay behind
 * the generic save-failed copy so internals never leak into the UI.
 */
export class UploadError extends Error {}

type RasterKind = "png" | "jpeg" | "webp";

/** Magic-byte sniffing: PNG / JPEG / WEBP (RIFF….WEBP). */
function sniff(bytes: Uint8Array): RasterKind | null {
  if (
    bytes.length >= 12 &&
    bytes[0] === 0x89 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x4e &&
    bytes[3] === 0x47 &&
    bytes[4] === 0x0d &&
    bytes[5] === 0x0a &&
    bytes[6] === 0x1a &&
    bytes[7] === 0x0a
  ) {
    return "png";
  }
  if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) {
    return "jpeg";
  }
  if (
    bytes.length >= 12 &&
    bytes[0] === 0x52 &&
    bytes[1] === 0x49 &&
    bytes[2] === 0x46 &&
    bytes[3] === 0x46 &&
    bytes[8] === 0x57 &&
    bytes[9] === 0x45 &&
    bytes[10] === 0x42 &&
    bytes[11] === 0x50
  ) {
    return "webp";
  }
  return null;
}

/**
 * Validate + store one uploaded file. Returns the public URL, or null when no
 * file was provided. Throws Error with a user-safe message on rejection.
 */
export async function uploadImage(
  file: File | null | undefined,
  folder: "products" | "collections",
): Promise<string | null> {
  if (!file || file.size === 0) return null;
  if (file.size > MAX_UPLOAD_BYTES) {
    throw new UploadError("Image must be 2 MB or smaller.");
  }
  const bytes = new Uint8Array(await file.arrayBuffer());
  const kind = sniff(bytes);
  if (!kind) {
    throw new UploadError("Only PNG, JPEG or WebP images are allowed.");
  }
  const ext = kind === "jpeg" ? "jpg" : kind;
  const { url } = await put(
    `${folder}/${crypto.randomUUID()}.${ext}`,
    Buffer.from(bytes),
    { access: "public" },
  );
  return url;
}

/** Best-effort cleanup of a replaced/deleted blob image. Never throws. */
export async function removeImage(url: string): Promise<void> {
  if (!url.includes("blob.vercel-storage.com")) return;
  try {
    await del(url);
  } catch (error) {
    console.warn("[uploads] failed to delete", url, error);
  }
}
