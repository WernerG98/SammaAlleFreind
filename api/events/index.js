import { prisma, withRemainingSeats } from "../_lib/db.js";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Methode nicht erlaubt." });
  }

  const events = await prisma.event.findMany({
    where: { isOpen: true },
    orderBy: { eventDate: "asc" },
    include: { buses: { include: { registrations: { select: { paid: true } } } } },
  });

  return res.status(200).json(events.map(withRemainingSeats));
}
