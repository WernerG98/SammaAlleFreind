import { prisma } from "../../_lib/db.js";
import { requireAdmin } from "../../_lib/auth.js";

function slugify(title) {
  return title
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export default async function handler(req, res) {
  const session = await requireAdmin(req, res);
  if (!session) return;

  if (req.method === "GET") {
    const events = await prisma.event.findMany({
      orderBy: { eventDate: "asc" },
      include: { buses: true, _count: { select: { registrations: true } } },
    });
    return res.status(200).json(events);
  }

  if (req.method === "POST") {
    const { title, description, eventDate, registrationDeadline, pricePerPerson, paypalLink, paymentNote, buses } =
      req.body || {};

    if (!title?.trim() || !eventDate || !Array.isArray(buses) || buses.length === 0) {
      return res.status(400).json({ error: "Titel, Datum und mindestens ein Bus sind erforderlich." });
    }

    const baseSlug = slugify(title);
    let slug = baseSlug;
    let counter = 1;
    while (await prisma.event.findUnique({ where: { slug } })) {
      slug = `${baseSlug}-${++counter}`;
    }

    const event = await prisma.event.create({
      data: {
        slug,
        title: title.trim(),
        description: description?.trim() || null,
        eventDate: new Date(eventDate),
        registrationDeadline: registrationDeadline ? new Date(registrationDeadline) : null,
        pricePerPerson: pricePerPerson ? Number(pricePerPerson) : null,
        paypalLink: paypalLink?.trim() || null,
        paymentNote: paymentNote?.trim() || null,
        buses: {
          create: buses.map((bus) => ({
            name: bus.name.trim(),
            capacity: Number(bus.capacity),
          })),
        },
      },
      include: { buses: true },
    });

    return res.status(201).json(event);
  }

  return res.status(405).json({ error: "Methode nicht erlaubt." });
}
