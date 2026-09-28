import { prisma, withRemainingSeats, cleanupExpiredEvents } from "../_lib/db.js";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Methode nicht erlaubt." });
  }

  try {
    await cleanupExpiredEvents();
  } catch {
    // Aufräumen soll das Laden der Veranstaltungen nicht blockieren.
  }

  const events = await prisma.event.findMany({
    where: { isOpen: true },
    orderBy: { eventDate: "asc" },
    include: { buses: { include: { registrations: { select: { paid: true } } } } },
  });

  res.setHeader("Cache-Control", "public, s-maxage=60, stale-while-revalidate=300");
  return res.status(200).json(events.map((event) => withRemainingSeats(event, { listMode: true })));
}
