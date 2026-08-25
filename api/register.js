import { prisma } from "./_lib/db.js";

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Methode nicht erlaubt." });
  }

  const { eventId, busId, firstName, lastName, email, newsletterOptIn } = req.body || {};

  if (!eventId || !busId || !firstName?.trim() || !lastName?.trim() || !isValidEmail(email || "")) {
    return res.status(400).json({ error: "Bitte alle Felder gültig ausfüllen." });
  }

  const event = await prisma.event.findUnique({ where: { id: eventId } });
  if (!event || !event.isOpen) {
    return res.status(404).json({ error: "Veranstaltung nicht gefunden." });
  }

  const bus = await prisma.bus.findUnique({
    where: { id: busId },
    include: { registrations: { select: { paid: true } } },
  });
  if (!bus || bus.eventId !== eventId) {
    return res.status(404).json({ error: "Bus nicht gefunden." });
  }

  const paidCount = bus.registrations.filter((r) => r.paid).length;
  if (paidCount >= bus.capacity) {
    return res.status(409).json({ error: "Dieser Bus ist bereits ausgebucht." });
  }

  const existing = await prisma.registration.findUnique({
    where: { eventId_email: { eventId, email: email.toLowerCase().trim() } },
  });
  if (existing) {
    return res.status(409).json({ error: "Diese E-Mail-Adresse ist für diese Veranstaltung bereits angemeldet." });
  }

  const registration = await prisma.registration.create({
    data: {
      eventId,
      busId,
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      email: email.toLowerCase().trim(),
      newsletterOptIn: Boolean(newsletterOptIn),
    },
  });

  return res.status(201).json({ id: registration.id });
}
