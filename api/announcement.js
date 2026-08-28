import { prisma } from "./_lib/db.js";
import { requireAdmin } from "./_lib/auth.js";

const SETTING_KEY = "announcement";

const DEFAULT_MESSAGES = [
  "🐞 Die neue Seite für unsere Veranstaltungen! Schwierigkeiten und Bugs bitte direkt melden, das würde uns sehr helfen. :)",
  "🤝 Wir stellen die Seite gerne auch lokalen Arnstorfer Vereinen und Personen zur Eventplanung zur Verfügung — einfach Kontakt aufnehmen!",
];

export default async function handler(req, res) {
  if (req.method === "GET") {
    const setting = await prisma.siteSetting.findUnique({ where: { key: SETTING_KEY } });
    const messages = setting
      ? setting.value.split("\n").map((line) => line.trim()).filter(Boolean)
      : DEFAULT_MESSAGES;
    return res.status(200).json({ messages });
  }

  if (req.method === "PUT") {
    const session = await requireAdmin(req, res, { fullOnly: true });
    if (!session) return;

    const { messages } = req.body || {};
    if (!Array.isArray(messages) || messages.some((m) => typeof m !== "string")) {
      return res.status(400).json({ error: "messages muss ein Array aus Texten sein." });
    }

    const cleaned = messages.map((m) => m.trim()).filter(Boolean);
    if (cleaned.length === 0) {
      return res.status(400).json({ error: "Mindestens eine Nachricht ist erforderlich." });
    }

    const value = cleaned.join("\n");
    await prisma.siteSetting.upsert({
      where: { key: SETTING_KEY },
      update: { value },
      create: { key: SETTING_KEY, value },
    });

    return res.status(200).json({ messages: cleaned });
  }

  return res.status(405).json({ error: "Methode nicht erlaubt." });
}
