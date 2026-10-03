import { requireAdmin } from "../_lib/auth.js";
import { uploadImageDataUrl, deleteImageIfManaged } from "../_lib/blob.js";

export default async function handler(req, res) {
  const session = await requireAdmin(req, res);
  if (!session) return;

  if (req.method === "POST") {
    const { dataUrl, thumbDataUrl, previousUrl } = req.body || {};
    if (!dataUrl) {
      return res.status(400).json({ error: "Kein Bild übermittelt." });
    }

    try {
      const url = await uploadImageDataUrl(dataUrl, { thumbDataUrl });
      if (previousUrl && previousUrl !== url) {
        await deleteImageIfManaged(previousUrl);
      }
      return res.status(200).json({ url });
    } catch (err) {
      return res.status(400).json({ error: err.message || "Bild konnte nicht hochgeladen werden." });
    }
  }

  if (req.method === "DELETE") {
    const { url } = req.body || {};
    await deleteImageIfManaged(url);
    return res.status(200).json({ success: true });
  }

  return res.status(405).json({ error: "Methode nicht erlaubt." });
}
