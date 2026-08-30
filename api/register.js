import crypto from "node:crypto";
import { prisma, isRegistrationOpen, isAccessUnlocked } from "./_lib/db.js";
import {
  sendEmail,
  buildInterestConfirmationHtml,
  buildWaitlistConfirmationHtml,
  buildConfirmationEmailHtml,
} from "./_lib/email.js";

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Methode nicht erlaubt." });
  }

  const { eventId, busId, firstName, lastName, email, newsletterOptIn, waitlist, password, website } =
    req.body || {};

  if (website) {
    return res.status(400).json({ error: "Ungültige Anfrage." });
  }

  if (!eventId || !firstName?.trim() || !lastName?.trim() || !isValidEmail(email || "")) {
    return res.status(400).json({ error: "Bitte alle Felder gültig ausfüllen." });
  }

  const event = await prisma.event.findUnique({ where: { id: eventId } });
  if (!event || !event.isOpen) {
    return res.status(404).json({ error: "Veranstaltung nicht gefunden." });
  }

  if (event.noRegistrationRequired) {
    return res.status(400).json({ error: "Diese Veranstaltung erfordert keine Anmeldung." });
  }

  if (!isAccessUnlocked(event, password)) {
    return res.status(403).json({ error: "Falsches Passwort." });
  }

  if (event.comingSoon || waitlist) {
    const normalizedEmail = email.toLowerCase().trim();
    const existingInterest = await prisma.eventInterest.findUnique({
      where: { eventId_email: { eventId, email: normalizedEmail } },
    });
    if (existingInterest) {
      return res.status(409).json({
        error: event.comingSoon
          ? "Du stehst bereits auf der Interessentenliste für diese Veranstaltung."
          : "Du stehst bereits auf der Warteliste für diese Veranstaltung.",
      });
    }

    const interest = await prisma.eventInterest.create({
      data: { eventId, firstName: firstName.trim(), lastName: lastName.trim(), email: normalizedEmail },
    });

    await sendEmail({
      to: normalizedEmail,
      subject: event.comingSoon ? `Interesse an ${event.title} bestätigt` : `Warteliste: ${event.title}`,
      html: event.comingSoon
        ? buildInterestConfirmationHtml({ firstName: firstName.trim(), event })
        : buildWaitlistConfirmationHtml({ firstName: firstName.trim(), event }),
    });

    return res.status(201).json({ interest: true, id: interest.id });
  }

  if (!busId || !isRegistrationOpen(event)) {
    return res.status(404).json({ error: "Anmeldung für diese Veranstaltung nicht mehr möglich." });
  }

  const bus = await prisma.bus.findUnique({
    where: { id: busId },
    include: { registrations: { select: { id: true } } },
  });
  if (!bus || bus.eventId !== eventId) {
    return res.status(404).json({ error: "Slot nicht gefunden." });
  }

  const existing = await prisma.registration.findUnique({
    where: { eventId_email: { eventId, email: email.toLowerCase().trim() } },
  });
  if (existing) {
    return res.status(409).json({
      error: "Diese E-Mail-Adresse ist für diese Veranstaltung bereits angemeldet.",
      registrationId: existing.id,
    });
  }

  if (bus.capacity !== null && bus.registrations.length >= bus.capacity) {
    return res.status(409).json({ error: "Dieser Slot ist bereits ausgebucht." });
  }

  const isFree = !event.pricePerPerson;

  const registration = await prisma.registration.create({
    data: {
      eventId,
      busId,
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      email: email.toLowerCase().trim(),
      newsletterOptIn: Boolean(newsletterOptIn),
      paid: isFree,
      paidAt: isFree ? new Date() : null,
    },
  });

  if (isFree) {
    if (newsletterOptIn) {
      await prisma.newsletterSubscriber.upsert({
        where: { email: registration.email },
        update: {},
        create: { email: registration.email, unsubscribeToken: crypto.randomBytes(24).toString("hex") },
      });
    }

    await sendEmail({
      to: registration.email,
      subject: `Bestätigung: ${event.title}`,
      html: buildConfirmationEmailHtml({ firstName: registration.firstName, event, busName: bus.name }),
    });
  }

  return res.status(201).json({ id: registration.id });
}
