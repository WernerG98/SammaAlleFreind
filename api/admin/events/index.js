import { prisma, parseCapacity, normalizeIbanOrBic } from "../../_lib/db.js";
import { requireAdmin } from "../../_lib/auth.js";
import { sendEmail, wrapRichTextHtml } from "../../_lib/email.js";

const STATS_TREND_MONTHS = 6;

function statsMonthBuckets() {
  const buckets = [];
  for (let i = STATS_TREND_MONTHS - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(1);
    d.setHours(0, 0, 0, 0);
    d.setMonth(d.getMonth() - i);
    buckets.push({
      year: d.getFullYear(),
      month: d.getMonth(),
      label: d.toLocaleDateString("de-DE", { month: "short" }),
      count: 0,
    });
  }
  return buckets;
}

async function buildStats() {
  const trendStart = new Date();
  trendStart.setDate(1);
  trendStart.setHours(0, 0, 0, 0);
  trendStart.setMonth(trendStart.getMonth() - (STATS_TREND_MONTHS - 1));

  const [
    totalEvents,
    externalEvents,
    comingSoonEvents,
    totalRegistrations,
    paidRegistrations,
    unpaidRegistrations,
    totalInterests,
    totalSubscribers,
    newsletterOptIns,
    paidOwnRegistrations,
    topEvents,
    recentRegistrations,
  ] = await Promise.all([
    prisma.event.count(),
    prisma.event.count({ where: { isExternal: true } }),
    prisma.event.count({ where: { comingSoon: true } }),
    prisma.registration.count(),
    prisma.registration.count({ where: { paid: true } }),
    prisma.registration.count({ where: { paid: false } }),
    prisma.eventInterest.count(),
    prisma.newsletterSubscriber.count(),
    prisma.registration.count({ where: { newsletterOptIn: true } }),
    prisma.registration.findMany({
      where: { paid: true, event: { isExternal: false } },
      select: { event: { select: { pricePerPerson: true } } },
    }),
    prisma.event.findMany({
      select: { id: true, title: true, isExternal: true, _count: { select: { registrations: true } } },
      orderBy: { registrations: { _count: "desc" } },
      take: 5,
    }),
    prisma.registration.findMany({
      where: { createdAt: { gte: trendStart } },
      select: { createdAt: true },
    }),
  ]);

  const totalRevenue = paidOwnRegistrations.reduce((sum, r) => sum + Number(r.event.pricePerPerson || 0), 0);

  const buckets = statsMonthBuckets();
  for (const r of recentRegistrations) {
    const d = new Date(r.createdAt);
    const bucket = buckets.find((b) => b.year === d.getFullYear() && b.month === d.getMonth());
    if (bucket) bucket.count += 1;
  }

  return {
    totalEvents,
    ourEvents: totalEvents - externalEvents,
    externalEvents,
    comingSoonEvents,
    totalRegistrations,
    paidRegistrations,
    unpaidRegistrations,
    totalRevenue,
    totalInterests,
    totalSubscribers,
    newsletterOptIns,
    topEvents: topEvents
      .filter((e) => e._count.registrations > 0)
      .map((e) => ({ id: e.id, title: e.title, isExternal: e.isExternal, registrations: e._count.registrations })),
    monthlyRegistrations: buckets.map(({ label, count }) => ({ label, count })),
  };
}

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
    if (req.query.stats === "1") {
      if (isExternalRole) {
        return res.status(403).json({ error: "Dafür fehlen dir die Berechtigungen." });
      }
      return res.status(200).json(await buildStats());
    }

    const events = await prisma.event.findMany({
      where: isExternalRole ? { isExternal: true } : undefined,
      orderBy: { eventDate: "asc" },
      include: { buses: true, _count: { select: { registrations: true, interests: true } } },
    });

    // Offene Zahlungen pro Veranstaltung (jede unbezahlte Anmeldung ist eine Person).
    const unpaid = await prisma.registration.groupBy({
      by: ["eventId"],
      where: { paid: false, eventId: { in: events.map((e) => e.id) } },
      _count: { _all: true },
    });
    const unpaidByEvent = new Map(unpaid.map((row) => [row.eventId, row._count._all]));

    return res
      .status(200)
      .json(events.map((event) => ({ ...event, unpaidRegistrations: unpaidByEvent.get(event.id) || 0 })));
  }

  if (req.method === "POST") {
    if (req.body?.action === "send-email") {
      const { eventId, target, busId, subject, bodyHtml } = req.body;
      if (!eventId || !["paid", "unpaid", "interested"].includes(target) || !subject?.trim() || !bodyHtml?.trim()) {
        return res
          .status(400)
          .json({ error: "eventId, target (paid/unpaid/interested), Betreff und Inhalt sind erforderlich." });
      }

      const owningEvent = await prisma.event.findUnique({
        where: { id: eventId },
        select: { isExternal: true, pricePerPerson: true },
      });
      if (isExternalRole && (!owningEvent || !owningEvent.isExternal)) {
        return res.status(403).json({ error: "Dafür fehlen dir die Berechtigungen." });
      }

      const recipients =
        target === "interested"
          ? await prisma.eventInterest.findMany({
              where: { eventId, ...(busId ? { busId } : {}) },
              select: { email: true },
            })
          : await prisma.registration.findMany({
              where: { eventId, paid: target === "paid" },
              select: {
                id: true,
                groupId: true,
                email: true,
                firstName: true,
                lastName: true,
                bus: { select: { name: true } },
              },
            });

      // Several registrations can now share one email (group signups) - group
      // by email so each recipient gets a single mail that lists every name
      // and slot it covers, instead of one mail per registration.
      const namesByEmail = new Map();
      const paymentLinkIdsByEmail = new Map();
      for (const r of recipients) {
        if (!namesByEmail.has(r.email)) {
          namesByEmail.set(r.email, []);
          paymentLinkIdsByEmail.set(r.email, new Map());
        }
        if (r.bus) namesByEmail.get(r.email).push(`${r.firstName} ${r.lastName} (${r.bus.name})`);
        // Eine gemeinsam angemeldete Gruppe hat eine gemeinsame Zahlungsseite, daher ein Link pro Gruppe.
        const groupKey = r.groupId || r.id;
        if (r.id && !paymentLinkIdsByEmail.get(r.email).has(groupKey)) {
          paymentLinkIdsByEmail.get(r.email).set(groupKey, r.id);
        }
      }

      const baseUrl = process.env.PUBLIC_BASE_URL || "http://localhost:3000";
      const pricePerPerson = owningEvent?.pricePerPerson ? Number(owningEvent.pricePerPerson) : 0;

      let sent = 0;
      const failed = [];
      for (const [recipientEmail, names] of namesByEmail) {
        const namesList = names.join(", ");
        const amount = pricePerPerson
          ? `${(pricePerPerson * names.length).toLocaleString("de-DE", {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })} €`
          : "kostenlos";
        const paymentLinks = [...paymentLinkIdsByEmail.get(recipientEmail).values()]
          .map((registrationId) => {
            const url = `${baseUrl}/anmeldung/${registrationId}/zahlung`;
            return `<a href="${url}">${url}</a>`;
          })
          .join("<br/>");

        let html = wrapRichTextHtml(bodyHtml).replace(/{betrag}/g, amount).replace(/{zahlungslink}/g, paymentLinks);
        if (namesList) {
          html = html.includes("{names}")
            ? html.replace(/{names}/g, namesList)
            : `${html}<p><strong>Betrifft:</strong> ${namesList}</p>`;
        }
        try {
          await sendEmail({ to: recipientEmail, subject: subject.trim(), html });
          sent += 1;
        } catch {
          failed.push(recipientEmail);
        }
      }

      return res.status(200).json({ sent, total: namesByEmail.size, failed });
    }

    const {
      title,
      description,
      imageUrl,
      eventDate,
      comingSoon,
      collectInterest,
      noRegistrationRequired,
      registrationDeadline,
      pricePerPerson,
      paypalLink,
      paymentNote,
      iban,
      bic,
      accountHolder,
      earlyAccessEnabled,
      earlyAccessPassword,
      isPrivate,
      privatePassword,
      commentsEnabled,
      isExternal,
      externalOrganizer,
      externalContactEmail,
      buses,
    } = req.body || {};

    const isComingSoon = Boolean(comingSoon);
    const isNoRegistrationRequired = !isComingSoon && Boolean(noRegistrationRequired);
    const isEarlyAccess = Boolean(earlyAccessEnabled);
    const isPrivateAccess = Boolean(isPrivate);
    const isCommentsEnabled = Boolean(commentsEnabled);
    const isExternalEvent = isExternalRole ? true : Boolean(isExternal);

    if (isEarlyAccess && !earlyAccessPassword?.trim()) {
      return res.status(400).json({ error: "Bitte ein Passwort für den Vorabzugang vergeben." });
    }
    if (isPrivateAccess && !privatePassword?.trim()) {
      return res.status(400).json({ error: "Bitte ein Passwort für den privaten Zugang vergeben." });
    }

    if (!title?.trim()) {
      return res.status(400).json({ error: "Titel ist erforderlich." });
    }
    if (isExternalEvent && !externalContactEmail?.trim()) {
      return res.status(400).json({ error: "Bitte eine Kontakt-E-Mail für die externe Veranstaltung angeben." });
    }
    if (isExternalEvent && !externalOrganizer?.trim()) {
      return res.status(400).json({ error: "Bitte Verein/Ansprechperson für die externe Veranstaltung angeben." });
    }
    if (!isComingSoon && !eventDate) {
      return res.status(400).json({ error: "Datum ist erforderlich." });
    }
    if (!isComingSoon && !isNoRegistrationRequired && (!Array.isArray(buses) || buses.length === 0)) {
      return res.status(400).json({ error: "Mindestens ein Slot ist erforderlich." });
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
        collectInterest: isComingSoon && Boolean(collectInterest),
        noRegistrationRequired: isNoRegistrationRequired,
        registrationDeadline: registrationDeadline ? new Date(registrationDeadline) : null,
        pricePerPerson: pricePerPerson ? Number(pricePerPerson) : null,
        paypalLink: paypalLink?.trim() || null,
        paymentNote: paymentNote?.trim() || null,
        iban: normalizeIbanOrBic(iban),
        bic: normalizeIbanOrBic(bic),
        accountHolder: accountHolder?.trim() || null,
        earlyAccessEnabled: isEarlyAccess,
        earlyAccessPassword: isEarlyAccess ? earlyAccessPassword.trim() : null,
        isPrivate: isPrivateAccess,
        privatePassword: isPrivateAccess ? privatePassword.trim() : null,
        commentsEnabled: isCommentsEnabled,
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
