import { prisma, parseCapacity } from "../../_lib/db.js";
import { requireAdmin } from "../../_lib/auth.js";

export default async function handler(req, res) {
  const session = await requireAdmin(req, res);
  if (!session) return;

  const { id } = req.query;

  if (session.role === "external") {
    const owningEvent = await prisma.event.findUnique({ where: { id }, select: { isExternal: true } });
    if (!owningEvent || !owningEvent.isExternal) {
      return res.status(403).json({ error: "Dafür fehlen dir die Berechtigungen." });
    }
  }

  if (req.method === "GET") {
    const event = await prisma.event.findUnique({
      where: { id },
      include: { buses: true },
    });
    if (!event) return res.status(404).json({ error: "Veranstaltung nicht gefunden." });
    return res.status(200).json(event);
  }

  if (req.method === "PUT") {
    const {
      title,
      description,
      imageUrl,
      eventDate,
      comingSoon,
      noRegistrationRequired,
      registrationDeadline,
      pricePerPerson,
      paypalLink,
      paymentNote,
      earlyAccessEnabled,
      earlyAccessPassword,
      isPrivate,
      privatePassword,
      isExternal,
      externalOrganizer,
      externalContactEmail,
      isOpen,
      buses,
    } = req.body || {};

    const isComingSoon = Boolean(comingSoon);
    const isNoRegistrationRequired = !isComingSoon && Boolean(noRegistrationRequired);
    const isEarlyAccess = Boolean(earlyAccessEnabled);
    const isPrivateAccess = Boolean(isPrivate);
    const busList = Array.isArray(buses) ? buses : [];
    const isExternalEvent = session.role === "external" ? true : Boolean(isExternal);

    if (!title?.trim()) {
      return res.status(400).json({ error: "Titel ist erforderlich." });
    }
    if (!isComingSoon && !eventDate) {
      return res.status(400).json({ error: "Datum ist erforderlich." });
    }
    if (!isComingSoon && !isNoRegistrationRequired && busList.length === 0) {
      return res.status(400).json({ error: "Mindestens ein Slot ist erforderlich." });
    }
    if (isEarlyAccess && !earlyAccessPassword?.trim()) {
      return res.status(400).json({ error: "Bitte ein Passwort für den Vorabzugang vergeben." });
    }
    if (isPrivateAccess && !privatePassword?.trim()) {
      return res.status(400).json({ error: "Bitte ein Passwort für den privaten Zugang vergeben." });
    }
    if (isExternalEvent && !externalContactEmail?.trim()) {
      return res.status(400).json({ error: "Bitte eine Kontakt-E-Mail für die externe Veranstaltung angeben." });
    }
    if (isExternalEvent && !externalOrganizer?.trim()) {
      return res.status(400).json({ error: "Bitte Verein/Ansprechperson angeben." });
    }

    const existingBuses = await prisma.bus.findMany({
      where: { eventId: id },
      include: { _count: { select: { registrations: true } } },
    });
    const keptIds = busList.filter((b) => b.id).map((b) => b.id);
    const toDelete = existingBuses.filter((b) => !keptIds.includes(b.id));

    const blocked = toDelete.find((b) => b._count.registrations > 0);
    if (blocked) {
      return res.status(409).json({
        error: `Slot "${blocked.name}" hat bereits Anmeldungen und kann nicht entfernt werden.`,
      });
    }

    await prisma.$transaction([
      ...toDelete.map((b) => prisma.bus.delete({ where: { id: b.id } })),
      ...busList
        .filter((b) => b.id)
        .map((b) =>
          prisma.bus.update({
            where: { id: b.id },
            data: {
              name: b.name.trim(),
              capacity: parseCapacity(b.capacity),
              enabled: b.enabled !== undefined ? Boolean(b.enabled) : true,
            },
          })
        ),
      ...busList
        .filter((b) => !b.id)
        .map((b) =>
          prisma.bus.create({
            data: {
              eventId: id,
              name: b.name.trim(),
              capacity: parseCapacity(b.capacity),
              enabled: b.enabled !== undefined ? Boolean(b.enabled) : true,
            },
          })
        ),
      prisma.event.update({
        where: { id },
        data: {
          title: title.trim(),
          description: description?.trim() || null,
          imageUrl: imageUrl?.trim() || null,
          eventDate: eventDate ? new Date(eventDate) : null,
          comingSoon: isComingSoon,
          noRegistrationRequired: isNoRegistrationRequired,
          registrationDeadline: registrationDeadline ? new Date(registrationDeadline) : null,
          pricePerPerson: pricePerPerson ? Number(pricePerPerson) : null,
          paypalLink: paypalLink?.trim() || null,
          paymentNote: paymentNote?.trim() || null,
          earlyAccessEnabled: isEarlyAccess,
          earlyAccessPassword: isEarlyAccess ? earlyAccessPassword.trim() : null,
          isPrivate: isPrivateAccess,
          privatePassword: isPrivateAccess ? privatePassword.trim() : null,
          isExternal: isExternalEvent,
          externalOrganizer: isExternalEvent ? externalOrganizer?.trim() || null : null,
          externalContactEmail: isExternalEvent ? externalContactEmail.trim() : null,
          isOpen: isOpen !== undefined ? Boolean(isOpen) : undefined,
        },
      }),
    ]);

    const updated = await prisma.event.findUnique({ where: { id }, include: { buses: true } });
    return res.status(200).json(updated);
  }

  if (req.method === "DELETE") {
    await prisma.event.delete({ where: { id } });
    return res.status(200).json({ success: true });
  }

  return res.status(405).json({ error: "Methode nicht erlaubt." });
}
