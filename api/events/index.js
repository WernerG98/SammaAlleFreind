import { prisma, withRemainingSeats, cleanupExpiredEvents } from "../_lib/db.js";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Methode nicht erlaubt." });
  }

  // Der tägliche Cron ruft diese Route mit ?cleanup=1 auf, damit das Aufräumen
  // nicht bei jedem normalen Seitenaufruf eine zusätzliche DB-Abfrage kostet.
  const isCleanupRun = req.query.cleanup === "1";
  if (isCleanupRun) {
    try {
      await cleanupExpiredEvents();
    } catch {
      // Aufräumen soll das Laden der Veranstaltungen nicht blockieren.
    }
  }

  const events = await prisma.event.findMany({
    where: { isOpen: true },
    orderBy: { eventDate: "asc" },
    include: { buses: { include: { _count: { select: { registrations: true } } } } },
  });

  res.setHeader(
    "Cache-Control",
    isCleanupRun ? "no-store" : "public, s-maxage=60, stale-while-revalidate=300"
  );
  return res.status(200).json(events.map((event) => withRemainingSeats(event, { listMode: true })));
}
