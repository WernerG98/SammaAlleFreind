import { prisma, withRemainingSeats } from "../_lib/db.js";

export default async function handler(req, res) {
  const { slug } = req.query;

  if (req.method === "POST") {
    const { email } = req.body || {};
    if (!email?.trim()) {
      return res.status(400).json({ error: "Bitte eine E-Mail-Adresse angeben." });
    }

    const event = await prisma.event.findUnique({ where: { slug } });
    if (!event) {
      return res.status(404).json({ error: "Veranstaltung nicht gefunden." });
    }

    const registrations = await prisma.registration.findMany({
      where: { eventId: event.id, email: email.toLowerCase().trim() },
      include: { bus: true },
      orderBy: { createdAt: "asc" },
    });
    if (registrations.length === 0) {
      return res.status(404).json({ error: "Keine Anmeldung mit dieser E-Mail-Adresse gefunden." });
    }

    return res.status(200).json({
      commentsEnabled: event.commentsEnabled,
      registrations: registrations.map((r) => ({
        registrationId: r.id,
        firstName: r.firstName,
        lastName: r.lastName,
        busName: r.bus.name,
        paid: r.paid,
        comment: r.comment,
      })),
    });
  }

  if (req.method !== "GET") {
    return res.status(405).json({ error: "Methode nicht erlaubt." });
  }

  const { password } = req.query;

  const event = await prisma.event.findUnique({
    where: { slug },
    include: { buses: { include: { registrations: { select: { paid: true } } } } },
  });

  if (!event || !event.isOpen) {
    return res.status(404).json({ error: "Veranstaltung nicht gefunden." });
  }

  return res.status(200).json(withRemainingSeats(event, { password }));
}
