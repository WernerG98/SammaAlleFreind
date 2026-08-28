import { prisma, parseCapacity } from "../../_lib/db.js";
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

  const isExternalRole = session.role === "external";

  if (req.method === "GET") {
    const events = await prisma.event.findMany({
      where: isExternalRole ? { isExternal: true } : undefined,
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

      if (isExternalRole) {
        const owningEvent = await prisma.event.findUnique({ where: { id: eventId }, select: { isExternal: true } });
        if (!owningEvent || !owningEvent.isExternal) {
          return res.status(403).json({ error: "Dafür fehlen dir die Berechtigungen." });
        }
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
      earlyAccessEnabled,
      earlyAccessPassword,
      isExternal,
      externalOrganizer,
      externalContactEmail,
      buses,
    } = req.body || {};

    const isComingSoon = Boolean(comingSoon);
    const isEarlyAccess = Boolean(earlyAccessEnabled);
    const isExternalEvent = isExternalRole ? true : Boolean(isExternal);

    if (isEarlyAccess && !earlyAccessPassword?.trim()) {
      return res.status(400).json({ error: "Bitte ein Passwort für den Vorabzugang vergeben." });
    }

    if (!title?.trim()) {
      return res.status(400).json({ error: "Titel ist erforderlich." });
    }
    if (isExternalEvent && !externalContactEmail?.trim()) {
      return res.status(400).json({ error: "Bitte eine Kontakt-E-Mail für die externe Veranstaltung angeben." });
    }
    if (isExternalRole && !externalOrganizer?.trim()) {
      return res.status(400).json({ error: "Bitte Verein/Ansprechperson angeben." });
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
        earlyAccessEnabled: isEarlyAccess,
        earlyAccessPassword: isEarlyAccess ? earlyAccessPassword.trim() : null,
        isExternal: isExternalEvent,
        externalOrganizer: isExternalEvent ? externalOrganizer?.trim() || null : null,
        externalContactEmail: isExternalEvent ? externalContactEmail.trim() : null,
        buses: {
          create: (buses || []).map((bus) => ({
            name: bus.name.trim(),
            capacity: parseCapacity(bus.capacity),
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
