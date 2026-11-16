import { prisma, withRemainingSeats, cleanupExpiredEvents } from "../_lib/db.js";
import { buildSitemapXml } from "../_lib/sitemap.js";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Methode nicht erlaubt." });
  }

  // /sitemap.xml wird per vercel.json-Rewrite hierher geleitet. Eigene Funktion geht nicht,
  // der Hobby-Plan erlaubt nur 12 Serverless-Funktionen.
  if (req.query.sitemap === "1") {
    res.setHeader("Content-Type", "application/xml; charset=utf-8");
    res.setHeader("Cache-Control", "public, s-maxage=3600, stale-while-revalidate=86400");
    return res.status(200).send(await buildSitemapXml());
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
    include: {
      buses: { include: { _count: { select: { registrations: true } } } },
      _count: { select: { interests: true } },
    },
  });

  res.setHeader(
    "Cache-Control",
    isCleanupRun ? "no-store" : "public, s-maxage=60, stale-while-revalidate=300"
  );
  return res.status(200).json(events.map((event) => withRemainingSeats(event, { listMode: true })));
}
