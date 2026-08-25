import crypto from "node:crypto";
import { prisma } from "../../../_lib/db.js";
import { requireAdmin } from "../../../_lib/auth.js";
import { sendEmail, buildConfirmationEmailHtml } from "../../../_lib/email.js";

export default async function handler(req, res) {
  const session = await requireAdmin(req, res);
  if (!session) return;

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Methode nicht erlaubt." });
  }

  const { id } = req.query;
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
