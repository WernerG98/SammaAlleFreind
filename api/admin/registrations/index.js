import { prisma } from "../../_lib/db.js";
import { requireAdmin } from "../../_lib/auth.js";
import { sendEmail, buildRegistrationRemovedHtml } from "../../_lib/email.js";

export default async function handler(req, res) {
  const session = await requireAdmin(req, res);
  if (!session) return;

  const { eventId } = req.query;
  if (!eventId) {
    return res.status(400).json({ error: "eventId ist erforderlich." });
  }

  const event = await prisma.event.findUnique({ where: { id: eventId } });
  if (!event) {
    return res.status(404).json({ error: "Veranstaltung nicht gefunden." });
  }
  if (session.role === "external" && !event.isExternal) {
    return res.status(403).json({ error: "Dafür fehlen dir die Berechtigungen." });
  }

  if (req.method === "GET") {
    const [registrations, interests] = await Promise.all([
      prisma.registration.findMany({
        where: { eventId },
        include: { bus: true },
        orderBy: { createdAt: "asc" },
      }),
      prisma.eventInterest.findMany({
        where: { eventId },
        orderBy: { createdAt: "asc" },
      }),
    ]);

    return res.status(200).json({ registrations, interests });
  }

  if (req.method === "DELETE") {
    const registrations = await prisma.registration.findMany({ where: { eventId } });
    if (registrations.length === 0) {
      return res.status(200).json({ removed: 0 });
    }

    await prisma.registration.deleteMany({ where: { eventId } });

    for (const registration of registrations) {
      try {
        await sendEmail({
          to: registration.email,
          subject: `Deine Anmeldung für ${event.title} wurde entfernt`,
          html: buildRegistrationRemovedHtml({ firstName: registration.firstName, event }),
        });
      } catch {
        // Einzelner Mailfehler soll den Rest der Löschung nicht blockieren.
      }
    }

    return res.status(200).json({ removed: registrations.length });
  }

  return res.status(405).json({ error: "Methode nicht erlaubt." });
}
