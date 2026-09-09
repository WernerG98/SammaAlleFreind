import crypto from "node:crypto";
import { prisma, isRegistrationOpen, isAccessUnlocked } from "./_lib/db.js";
import { sendEmail, buildWaitlistConfirmationHtml, buildConfirmationEmailHtml } from "./_lib/email.js";

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Methode nicht erlaubt." });
  }

  const {
    eventId,
    busId,
    firstName,
    lastName,
    email,
    additionalPeople,
    newsletterOptIn,
    comment,
    waitlist,
    interestedBusId,
    password,
    website,
  } = req.body || {};

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

  if (waitlist) {
    const normalizedEmail = email.toLowerCase().trim();
    const existingInterest = await prisma.eventInterest.findUnique({
      where: { eventId_email: { eventId, email: normalizedEmail } },
    });
    if (existingInterest) {
      return res.status(409).json({ error: "Du stehst bereits auf der Warteliste für diese Veranstaltung." });
    }

    let interestBus = null;
    if (interestedBusId) {
      interestBus = await prisma.bus.findUnique({ where: { id: interestedBusId } });
      if (!interestBus || interestBus.eventId !== eventId) {
        return res.status(404).json({ error: "Slot nicht gefunden." });
      }
    }

    const interest = await prisma.eventInterest.create({
      data: {
        eventId,
        busId: interestBus?.id || null,
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: normalizedEmail,
      },
    });

    await sendEmail({
      to: normalizedEmail,
      subject: interestBus ? `Interesse vermerkt: ${event.title}` : `Warteliste: ${event.title}`,
      html: buildWaitlistConfirmationHtml({ firstName: firstName.trim(), event, busName: interestBus?.name }),
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

  const normalizedEmail = email.toLowerCase().trim();

  const peopleInput = [
    { firstName: firstName.trim(), lastName: lastName.trim() },
    ...(Array.isArray(additionalPeople) ? additionalPeople : []),
  ];
  for (const p of peopleInput) {
    if (!p?.firstName?.trim() || !p?.lastName?.trim()) {
      return res.status(400).json({ error: "Bitte für jede Person Vorname und Nachname angeben." });
    }
  }
  const people = peopleInput.map((p) => ({ firstName: p.firstName.trim(), lastName: p.lastName.trim() }));

  // Skip people who already have an identical (name + email) registration for
  // this event - avoids duplicates on accidental resubmission while still
  // letting a shared email register several different people.
  const existingForEvent = await prisma.registration.findMany({
    where: { eventId, email: normalizedEmail },
    select: { id: true, firstName: true, lastName: true },
  });
  const existingKey = (r) => `${r.firstName.toLowerCase()}|${r.lastName.toLowerCase()}`;
  const alreadyRegistered = new Set(existingForEvent.map(existingKey));
  const newPeople = people.filter((p) => !alreadyRegistered.has(existingKey(p)));

  if (newPeople.length === 0) {
    const primaryExisting = existingForEvent.find((r) => existingKey(r) === existingKey(people[0]));
    return res.status(409).json({
      error: "Diese Person ist für diese Veranstaltung bereits angemeldet.",
      registrationId: primaryExisting?.id,
    });
  }

  if (bus.capacity !== null) {
    const remaining = bus.capacity - bus.registrations.length;
    if (newPeople.length > remaining) {
      return res.status(409).json({
        error:
          remaining <= 0
            ? "Dieser Slot ist bereits ausgebucht."
            : `Für ${newPeople.length} Personen sind nicht mehr genug Plätze frei (noch ${remaining} frei).`,
      });
    }
  }

  const isFree = !event.pricePerPerson;
  const groupId = crypto.randomUUID();

  const createdRegistrations = await prisma.$transaction(
    newPeople.map((p) =>
      prisma.registration.create({
        data: {
          eventId,
          busId,
          groupId,
          firstName: p.firstName,
          lastName: p.lastName,
          email: normalizedEmail,
          newsletterOptIn: Boolean(newsletterOptIn),
          comment: event.commentsEnabled ? comment?.trim() || null : null,
          paid: isFree,
          paidAt: isFree ? new Date() : null,
        },
      })
    )
  );

  if (isFree) {
    if (newsletterOptIn) {
      await prisma.newsletterSubscriber.upsert({
        where: { email: normalizedEmail },
        update: {},
        create: { email: normalizedEmail, unsubscribeToken: crypto.randomBytes(24).toString("hex") },
      });
    }

    await sendEmail({
      to: normalizedEmail,
      subject: `Bestätigung: ${event.title}`,
      html: buildConfirmationEmailHtml({
        firstName: createdRegistrations[0].firstName,
        names: createdRegistrations.map((r) => `${r.firstName} ${r.lastName}`),
        event,
        busName: bus.name,
        isFree: true,
      }),
    });
  }

  let primaryRegistration = createdRegistrations.find((r) => existingKey(r) === existingKey(people[0]));
  if (!primaryRegistration) {
    const existingPrimary = existingForEvent.find((r) => existingKey(r) === existingKey(people[0]));
    primaryRegistration = existingPrimary || createdRegistrations[0];
  }

  return res.status(201).json({ id: primaryRegistration.id, groupSize: createdRegistrations.length });
}
