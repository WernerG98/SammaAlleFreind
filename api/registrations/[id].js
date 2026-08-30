import { prisma } from "../_lib/db.js";
import { sendEmail, buildSelfCancelConfirmationHtml, buildOrganizerRefundNoticeHtml, getOrganizerEmail } from "../_lib/email.js";

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

  if (req.method === "DELETE") {
    const registration = await prisma.registration.findUnique({
      where: { id },
      include: { event: true, bus: true },
    });

    if (!registration) {
      return res.status(404).json({ error: "Anmeldung nicht gefunden." });
    }

    await prisma.registration.delete({ where: { id } });

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
