import crypto from "node:crypto";
import { put, del } from "@vercel/blob";

const MAX_UPLOAD_BYTES = 4 * 1024 * 1024;
const MAX_THUMB_BYTES = 200 * 1024;
const MAX_MEDIUM_BYTES = 600 * 1024;

export function isManagedBlobUrl(url) {
  try {
    return Boolean(url) && new URL(url).hostname.endsWith(".public.blob.vercel-storage.com");
  } catch {
    return false;
  }
}

// Varianten liegen immer neben dem Original: "<name>.jpg" -> "<name>-thumb.jpg" / "<name>-md.jpg".
function variantUrlFor(imageUrl, suffix) {
  if (!imageUrl || imageUrl.startsWith("data:")) return null;
  if (!isManagedBlobUrl(imageUrl) && !imageUrl.startsWith("/")) return null;
  return imageUrl.replace(/\.[a-zA-Z0-9]+$/, `-${suffix}.jpg`);
}

export const thumbUrlFor = (imageUrl) => variantUrlFor(imageUrl, "thumb");
export const mediumUrlFor = (imageUrl) => variantUrlFor(imageUrl, "md");

function parseImageDataUrl(dataUrl, maxBytes) {
  const match = /^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/.exec(dataUrl || "");
  if (!match) {
    throw new Error("Ungültiges Bildformat.");
  }
  const buffer = Buffer.from(match[2], "base64");
  if (buffer.length > maxBytes) {
    throw new Error("Bild ist auch komprimiert noch zu groß.");
  }
  return { mimeType: match[1], buffer };
}

export async function uploadImageDataUrl(dataUrl, { thumbDataUrl, mediumDataUrl, prefix = "events" } = {}) {
  const image = parseImageDataUrl(dataUrl, MAX_UPLOAD_BYTES);
  const thumb = thumbDataUrl ? parseImageDataUrl(thumbDataUrl, MAX_THUMB_BYTES) : null;
  const medium = mediumDataUrl ? parseImageDataUrl(mediumDataUrl, MAX_MEDIUM_BYTES) : null;

  const id = crypto.randomUUID();
  const ext = image.mimeType.split("/")[1].replace("jpeg", "jpg");
  const blob = await put(`${prefix}/${id}.${ext}`, image.buffer, {
    access: "public",
    contentType: image.mimeType,
  });

  if (thumb) {
    await put(`${prefix}/${id}-thumb.jpg`, thumb.buffer, { access: "public", contentType: "image/jpeg" });
  }
  if (medium) {
    await put(`${prefix}/${id}-md.jpg`, medium.buffer, { access: "public", contentType: "image/jpeg" });
  }
  return blob.url;
}

export async function deleteImageIfManaged(url) {
  if (!isManagedBlobUrl(url)) return;
  try {
    await del([url, thumbUrlFor(url), mediumUrlFor(url)]);
  } catch {
    // Aufräumen soll die eigentliche Aktion nie blockieren.
  }
}
