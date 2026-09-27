import crypto from "node:crypto";
import { prisma } from "../../_lib/db.js";
import { requireAdmin } from "../../_lib/auth.js";
import {
  sendEmail,
  buildConfirmationEmailHtml,
  buildBusChangedHtml,
  buildRegistrationRemovedHtml,
  buildInterestRemovedHtml,
  buildWaitlistPromotedHtml,
} from "../../_lib/email.js";

export default async function handler(req, res) {
  const session = await requireAdmin(req, res);
  if (!session) return;

  const { id } = req.query;

  if (req.method === "POST") {
    const { paid, busId } = req.body || {};

    const registration = await prisma.registration.findUnique({
      where: { id },
      include: { event: true, bus: true },
    });

    if (!registration) {
      // Not a registration - maybe promoting someone from the waitlist to a real slot.
      const interest = await prisma.eventInterest.findUnique({
        where: { id },
        include: { event: true },
      });
      if (!interest) {
        return res.status(404).json({ error: "Anmeldung nicht gefunden." });
      }
      if (session.role === "external" && !interest.event.isExternal) {
        return res.status(403).json({ error: "Dafür fehlen dir die Berechtigungen." });
      }
      if (!busId) {
        return res.status(400).json({ error: "Bitte einen Slot auswählen." });
      }

      const targetBus = await prisma.bus.findUnique({
        where: { id: busId },
        include: { registrations: { select: { id: true } } },
      });
      if (!targetBus || targetBus.eventId !== interest.eventId) {
        return res.status(404).json({ error: "Slot nicht gefunden." });
      }
      if (!targetBus.enabled) {
        return res.status(409).json({ error: "Dieser Slot ist aktuell nicht buchbar." });
      }
      if (targetBus.capacity !== null && targetBus.registrations.length >= targetBus.capacity) {
        return res.status(409).json({ error: "Dieser Slot hat keine freien Plätze mehr." });
      }

      const isFree = !interest.event.pricePerPerson;
      const [newRegistration] = await prisma.$transaction([
        prisma.registration.create({
          data: {
            eventId: interest.eventId,
            busId: targetBus.id,
            firstName: interest.firstName,
            lastName: interest.lastName,
            email: interest.email,
            paid: isFree,
            paidAt: isFree ? new Date() : null,
          },
        }),
        prisma.eventInterest.delete({ where: { id: interest.id } }),
      ]);

      await sendEmail({
        to: interest.email,
        subject: `Ein Platz ist frei geworden: ${interest.event.title}`,
        html: buildWaitlistPromotedHtml({
          firstName: interest.firstName,
          event: interest.event,
          busName: targetBus.name,
          registrationId: newRegistration.id,
          isFree,
        }),
      });

      return res.status(200).json(newRegistration);
    }
    if (session.role === "external" && !registration.event.isExternal) {
      return res.status(403).json({ error: "Dafür fehlen dir die Berechtigungen." });
    }

    const nextPaid = paid !== undefined ? Boolean(paid) : registration.paid;
    const wasUnpaid = !registration.paid;
    const changingBus = Boolean(busId) && busId !== registration.busId;
    let targetBusId = registration.busId;
    let targetBus = registration.bus;

    if (changingBus) {
      targetBus = await prisma.bus.findUnique({
        where: { id: busId },
        include: { registrations: { select: { id: true } } },
      });
      if (!targetBus || targetBus.eventId !== registration.eventId) {
        return res.status(404).json({ error: "Zielbus nicht gefunden." });
      }
      if (targetBus.capacity !== null && targetBus.registrations.length >= targetBus.capacity) {
        return res.status(409).json({ error: "Der Zielbus hat keine freien Plätze mehr." });
      }
      targetBusId = busId;
    }

    const updated = await prisma.registration.update({
      where: { id },
      data: { paid: nextPaid, paidAt: nextPaid ? new Date() : null, busId: targetBusId },
    });

    if (nextPaid && wasUnpaid) {
      if (registration.newsletterOptIn) {
        await prisma.newsletterSubscriber.upsert({
          where: { email: registration.email },
          update: {},
          create: { email: registration.email, unsubscribeToken: crypto.randomBytes(24).toString("hex") },
        });
      }

      await sendEmail({
        to: registration.email,
        subject: `Bestätigung: ${registration.event.title}`,
        html: buildConfirmationEmailHtml({
          firstName: registration.firstName,
          event: registration.event,
          busName: targetBus.name,
        }),
      });
    } else if (changingBus) {
      await sendEmail({
        to: registration.email,
        subject: `Slot geändert: ${registration.event.title}`,
        html: buildBusChangedHtml({
          firstName: registration.firstName,
          event: registration.event,
          busName: targetBus.name,
        }),
      });
    }

    return res.status(200).json(updated);
  }

  if (req.method === "DELETE") {
    const registration = await prisma.registration.findUnique({
      where: { id },
      include: { event: true },
    });

    if (registration) {
      if (session.role === "external" && !registration.event.isExternal) {
        return res.status(403).json({ error: "Dafür fehlen dir die Berechtigungen." });
      }
      await prisma.registration.delete({ where: { id } });
      await sendEmail({
        to: registration.email,
        subject: `Deine Anmeldung für ${registration.event.title} wurde entfernt`,
        html: buildRegistrationRemovedHtml({ firstName: registration.firstName, event: registration.event }),
      });
      return res.status(200).json({ success: true });
    }

    const interest = await prisma.eventInterest.findUnique({
      where: { id },
      include: { event: true },
    });

    if (interest) {
      if (session.role === "external" && !interest.event.isExternal) {
        return res.status(403).json({ error: "Dafür fehlen dir die Berechtigungen." });
      }
      await prisma.eventInterest.delete({ where: { id } });
      await sendEmail({
        to: interest.email,
        subject: `Du wurdest von der Interessentenliste für ${interest.event.title} entfernt`,
        html: buildInterestRemovedHtml({ firstName: interest.firstName, event: interest.event }),
      });
      return res.status(200).json({ success: true });
    }

    return res.status(404).json({ error: "Eintrag nicht gefunden." });
  }

  return res.status(405).json({ error: "Methode nicht erlaubt." });
}
