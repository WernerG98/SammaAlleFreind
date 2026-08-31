import crypto from "node:crypto";
import { prisma } from "../_lib/db.js";
import {
  sendEmail,
  buildCancelRequestHtml,
  buildSelfCancelConfirmationHtml,
  buildOrganizerRefundNoticeHtml,
  getOrganizerEmail,
} from "../_lib/email.js";

export default async function handler(req, res) {
  const { id } = req.query;

  if (req.method === "GET") {
    const registration = await prisma.registration.findUnique({
      where: { id },
      include: { event: true, bus: true },
    });

    if (!registration) {
      return res.status(404).json({ error: "Anmeldung nicht gefunden." });
    }

    return res.status(200).json({
      id: registration.id,
      firstName: registration.firstName,
      lastName: registration.lastName,
      paid: registration.paid,
      bus: { name: registration.bus.name },
      event: {
        title: registration.event.title,
        pricePerPerson: registration.event.pricePerPerson,
        paypalLink: registration.event.paypalLink,
        paymentNote: registration.event.paymentNote,
      },
    });
  }

  // Lets a registrant update their own comment later - guarded the same way as
  // the GET/POST above: knowledge of the (hard-to-guess) registration id.
  if (req.method === "PATCH") {
    const { comment } = req.body || {};
    const registration = await prisma.registration.findUnique({
      where: { id },
      include: { event: true },
    });

    if (!registration) {
      return res.status(404).json({ error: "Anmeldung nicht gefunden." });
    }
    if (!registration.event.commentsEnabled) {
      return res.status(400).json({ error: "Kommentare sind für diese Veranstaltung nicht aktiviert." });
    }

    const updated = await prisma.registration.update({
      where: { id },
      data: { comment: comment?.trim() || null },
    });

    return res.status(200).json({ comment: updated.comment });
  }

  // Requests a cancellation e-mail: proves nothing about the caller, but the
  // actual cancellation link only ever reaches the registrant's own inbox.
  if (req.method === "POST") {
    const registration = await prisma.registration.findUnique({
      where: { id },
      include: { event: true },
    });

    if (!registration) {
      return res.status(404).json({ error: "Anmeldung nicht gefunden." });
    }

    const cancelToken = registration.cancelToken || crypto.randomBytes(24).toString("hex");
    if (!registration.cancelToken) {
      await prisma.registration.update({ where: { id }, data: { cancelToken } });
    }

    const baseUrl = process.env.PUBLIC_BASE_URL || "http://localhost:3000";
    await sendEmail({
      to: registration.email,
      subject: `Anmeldung stornieren: ${registration.event.title}`,
      html: buildCancelRequestHtml({
        firstName: registration.firstName,
        event: registration.event,
        cancelUrl: `${baseUrl}/anmeldung/stornieren?token=${cancelToken}`,
      }),
    });

    return res.status(200).json({ sent: true });
  }

  // Confirms the cancellation - the "id" here is the secret cancelToken from
  // the emailed link, not the registration's real id, so only someone with
  // access to the registrant's inbox can actually delete it.
  if (req.method === "DELETE") {
    const registration = await prisma.registration.findFirst({
      where: { cancelToken: id },
      include: { event: true, bus: true },
    });

    if (!registration) {
      return res.status(404).json({ error: "Ungültiger oder bereits verwendeter Stornierungslink." });
    }

    await prisma.registration.delete({ where: { id: registration.id } });

    await sendEmail({
      to: registration.email,
      subject: `Abmeldung: ${registration.event.title}`,
      html: buildSelfCancelConfirmationHtml({
        firstName: registration.firstName,
        event: registration.event,
        wasPaid: registration.paid,
      }),
    });

    if (registration.paid) {
      const organizerEmail = getOrganizerEmail(registration.event);
      if (organizerEmail) {
        await sendEmail({
          to: organizerEmail,
          subject: `Stornierung mit Rückerstattung: ${registration.event.title}`,
          html: buildOrganizerRefundNoticeHtml({
            firstName: registration.firstName,
            lastName: registration.lastName,
            email: registration.email,
            event: registration.event,
            busName: registration.bus.name,
          }),
        });
      }
    }

    return res.status(200).json({ success: true });
  }

  return res.status(405).json({ error: "Methode nicht erlaubt." });
}
