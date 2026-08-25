import { prisma } from "../../_lib/db.js";
import { requireAdmin } from "../../_lib/auth.js";

export default async function handler(req, res) {
  const session = await requireAdmin(req, res);
  if (!session) return;

  if (req.method !== "GET") {
    return res.status(405).json({ error: "Methode nicht erlaubt." });
  }

  const { eventId } = req.query;
  if (!eventId) {
    return res.status(400).json({ error: "eventId ist erforderlich." });
  }

  const registrations = await prisma.registration.findMany({
    where: { eventId },
    include: { bus: true },
    orderBy: { createdAt: "asc" },
  });

  return res.status(200).json(registrations);
}
