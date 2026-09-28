import crypto from "node:crypto";
import { put, del } from "@vercel/blob";

const MAX_UPLOAD_BYTES = 4 * 1024 * 1024;

export function isManagedBlobUrl(url) {
  try {
    return Boolean(url) && new URL(url).hostname.endsWith(".public.blob.vercel-storage.com");
  } catch {
    return false;
  }
}

export async function uploadImageDataUrl(dataUrl, { prefix = "events" } = {}) {
  const match = /^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/.exec(dataUrl || "");
  if (!match) {
    throw new Error("Ungültiges Bildformat.");
  }
  const [, mimeType, base64] = match;
  const buffer = Buffer.from(base64, "base64");
  if (buffer.length > MAX_UPLOAD_BYTES) {
    throw new Error("Bild ist auch komprimiert noch zu groß.");
  }

  const ext = mimeType.split("/")[1].replace("jpeg", "jpg");
  const blob = await put(`${prefix}/${crypto.randomUUID()}.${ext}`, buffer, {
    access: "public",
    contentType: mimeType,
  });
  return blob.url;
}

export async function deleteImageIfManaged(url) {
  if (!isManagedBlobUrl(url)) return;
  try {
    await del(url);
  } catch {
    // Aufräumen soll die eigentliche Aktion nie blockieren.
  }
}
