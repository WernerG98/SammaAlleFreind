import { prisma, withRemainingSeats } from "../_lib/db.js";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Methode nicht erlaubt." });
  }

  const { slug, password } = req.query;

  const event = await prisma.event.findUnique({
    where: { slug },
    include: { buses: { include: { registrations: { select: { paid: true } } } } },
  });

  if (!event || !event.isOpen) {
    return res.status(404).json({ error: "Veranstaltung nicht gefunden." });
  }

  return res.status(200).json(withRemainingSeats(event, { password }));
}
