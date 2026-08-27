import crypto from "node:crypto";
import { prisma } from "../../_lib/db.js";
import { requireAdmin } from "../../_lib/auth.js";
import {
  sendEmail,
  buildConfirmationEmailHtml,
  buildRegistrationRemovedHtml,
  buildInterestRemovedHtml,
} from "../../_lib/email.js";

export default async function handler(req, res) {
  const session = await requireAdmin(req, res);
  if (!session) return;

  const { id } = req.query;

  if (req.method === "POST") {
    const { paid } = req.body || {};

    const registration = await prisma.registration.findUnique({
      where: { id },
      include: { event: true, bus: { include: { registrations: { select: { paid: true } } } } },
    });

    if (!registration) {
      return res.status(404).json({ error: "Anmeldung nicht gefunden." });
    }

    const nextPaid = Boolean(paid);
    const wasUnpaid = !registration.paid;

    if (nextPaid && wasUnpaid) {
      const paidCount = registration.bus.registrations.filter((r) => r.paid).length;
      if (paidCount >= registration.bus.capacity) {
        return res.status(409).json({ error: "Für diesen Bus sind bereits alle Plätze als bezahlt vergeben." });
      }
    }

    const updated = await prisma.registration.update({
      where: { id },
      data: { paid: nextPaid, paidAt: nextPaid ? new Date() : null },
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
          busName: registration.bus.name,
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
