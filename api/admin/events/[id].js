import { prisma } from "../../_lib/db.js";
import { requireAdmin } from "../../_lib/auth.js";

export default async function handler(req, res) {
  const session = await requireAdmin(req, res);
  if (!session) return;

  const { id } = req.query;

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
      registrationDeadline,
      pricePerPerson,
      paypalLink,
      paymentNote,
      isOpen,
      buses,
    } = req.body || {};

    const isComingSoon = Boolean(comingSoon);
    const busList = Array.isArray(buses) ? buses : [];

    if (!title?.trim()) {
      return res.status(400).json({ error: "Titel ist erforderlich." });
    }
    if (!isComingSoon && (!eventDate || busList.length === 0)) {
      return res.status(400).json({ error: "Datum und mindestens ein Bus sind erforderlich." });
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
        error: `Bus "${blocked.name}" hat bereits Anmeldungen und kann nicht entfernt werden.`,
      });
    }

    await prisma.$transaction([
      ...toDelete.map((b) => prisma.bus.delete({ where: { id: b.id } })),
      ...busList
        .filter((b) => b.id)
        .map((b) =>
          prisma.bus.update({
            where: { id: b.id },
            data: { name: b.name.trim(), capacity: Number(b.capacity) },
          })
        ),
      ...busList
        .filter((b) => !b.id)
        .map((b) =>
          prisma.bus.create({
            data: { eventId: id, name: b.name.trim(), capacity: Number(b.capacity) },
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
          registrationDeadline: registrationDeadline ? new Date(registrationDeadline) : null,
          pricePerPerson: pricePerPerson ? Number(pricePerPerson) : null,
          paypalLink: paypalLink?.trim() || null,
          paymentNote: paymentNote?.trim() || null,
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
