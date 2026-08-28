import { prisma } from "../../_lib/db.js";
import { requireAdmin } from "../../_lib/auth.js";
import { sendEmail } from "../../_lib/email.js";

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
    if (req.body?.action === "send-email") {
      const { eventId, target, subject, bodyHtml } = req.body;
      if (!eventId || !["paid", "unpaid"].includes(target) || !subject?.trim() || !bodyHtml?.trim()) {
        return res.status(400).json({ error: "eventId, target (paid/unpaid), Betreff und Inhalt sind erforderlich." });
      }

      const recipients = await prisma.registration.findMany({
        where: { eventId, paid: target === "paid" },
        select: { email: true },
      });

      let sent = 0;
      const failed = [];
      for (const r of recipients) {
        try {
          await sendEmail({ to: r.email, subject: subject.trim(), html: bodyHtml });
          sent += 1;
        } catch {
          failed.push(r.email);
        }
      }

      return res.status(200).json({ sent, total: recipients.length, failed });
    }

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
      buses,
    } = req.body || {};

    const isComingSoon = Boolean(comingSoon);

    if (!title?.trim()) {
      return res.status(400).json({ error: "Titel ist erforderlich." });
    }
    if (!isComingSoon && (!eventDate || !Array.isArray(buses) || buses.length === 0)) {
      return res.status(400).json({ error: "Datum und mindestens ein Bus sind erforderlich." });
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
        imageUrl: imageUrl?.trim() || null,
        eventDate: eventDate ? new Date(eventDate) : null,
        comingSoon: isComingSoon,
        registrationDeadline: registrationDeadline ? new Date(registrationDeadline) : null,
        pricePerPerson: pricePerPerson ? Number(pricePerPerson) : null,
        paypalLink: paypalLink?.trim() || null,
        paymentNote: paymentNote?.trim() || null,
        buses: {
          create: (buses || []).map((bus) => ({
            name: bus.name.trim(),
            capacity: Number(bus.capacity),
            enabled: bus.enabled !== undefined ? Boolean(bus.enabled) : true,
          })),
        },
      },
      include: { buses: true },
    });

    return res.status(201).json(event);
  }

  return res.status(405).json({ error: "Methode nicht erlaubt." });
}
