import crypto from "node:crypto";
import { prisma, isRegistrationOpen } from "./db.js";
import { sendEmail, buildWaitlistOfferHtml } from "./email.js";

// Erst 60 Minuten nach der Stornierung wird nachgerückt (vielleicht storniert jemand nur kurz
// um oder ihr weist selbst zu). Ein Angebot gilt 24 Stunden, dann ist die nächste Person dran.
export const OFFER_DELAY_MS = 60 * 60 * 1000;
export const OFFER_VALID_MS = 24 * 60 * 60 * 1000;
const FIRST_OFFER_FLAG = "waitlist-first-offer-notified";

// Einmalige Info an euch, dass das automatische Nachrücken zum ersten Mal gelaufen ist.
// Der eindeutige Schlüssel sorgt dafür, dass es auch bei parallelen Läufen genau eine Mail bleibt.
async function notifyFirstOfferOnce(interest, event, db, send) {
  if (await db.siteSetting.findUnique({ where: { key: FIRST_OFFER_FLAG } })) return;
  try {
    await db.siteSetting.create({ data: { key: FIRST_OFFER_FLAG, value: new Date().toISOString() } });
  } catch {
    return;
  }
  const to = process.env.REPLY_TO_EMAIL;
  if (!to) return;
  try {
    await send({
      to,
      subject: "Warteliste: erste automatische Mail verschickt",
      html: `
        <h2>Das automatische Nachrücken läuft</h2>
        <p>Gerade wurde zum ersten Mal automatisch eine Wartelisten-Mail verschickt:</p>
        <p><strong>${interest.firstName} ${interest.lastName}</strong> (${interest.email}) für <strong>${event.title}</strong>.</p>
        <p style="font-size: 13px; color: #555;">Diese Info bekommst du nur dieses eine Mal.</p>
      `,
    });
  } catch (err) {
    console.error("Erst-Info an Organisator fehlgeschlagen:", err.message);
  }
}

// Merkt sich frei gewordene Plätze. Nur begrenzte Slots, bei unbegrenzten gibt es keine Warteliste.
export async function recordSeatReleases(registrations, db = prisma) {
  const busIds = [...new Set(registrations.map((r) => r.busId).filter(Boolean))];
  if (busIds.length === 0) return;
  const buses = await db.bus.findMany({ where: { id: { in: busIds } }, select: { id: true, capacity: true } });
  const limited = new Set(buses.filter((b) => b.capacity !== null).map((b) => b.id));
  const data = registrations.filter((r) => limited.has(r.busId)).map((r) => ({ eventId: r.eventId, busId: r.busId }));
  if (data.length > 0) await db.seatRelease.createMany({ data });
}

// Darf eine Stornierung nie scheitern lassen: Fehler nur protokollieren.
export async function recordSeatReleasesSafely(registrations) {
  try {
    await recordSeatReleases(registrations);
  } catch (err) {
    console.error("Freier Platz konnte nicht vorgemerkt werden:", err.message);
  }
}

function formatBerlin(date) {
  return `${date.toLocaleDateString("de-DE", {
    timeZone: "Europe/Berlin",
    weekday: "short",
    day: "2-digit",
    month: "2-digit",
  })}, ${date.toLocaleTimeString("de-DE", { timeZone: "Europe/Berlin", hour: "2-digit", minute: "2-digit" })} Uhr`;
}

async function sendOffer(interest, event, offeredAt, token, send) {
  const baseUrl = process.env.PUBLIC_BASE_URL || "http://localhost:3000";
  await send({
    to: interest.email,
    subject: `Ein Platz ist frei: ${event.title}`,
    html: buildWaitlistOfferHtml({
      firstName: interest.firstName,
      event,
      eventUrl: `${baseUrl}/veranstaltung/${event.slug}`,
      responseUrl: `${baseUrl}/warteliste/antwort?token=${token}`,
      validUntil: formatBerlin(new Date(offeredAt.getTime() + OFFER_VALID_MS)),
    }),
  });
}

// Wird alle ~10 Minuten angestoßen (und direkt nach "Nein danke"/"Streichen").
export async function processSeatReleases({ eventId, db = prisma, send = sendEmail, now = Date.now() } = {}) {
  const summary = { offered: 0, closed: 0, waiting: 0 };
  const releases = await db.seatRelease.findMany({
    where: {
      closedAt: null,
      releasedAt: { lte: new Date(now - OFFER_DELAY_MS) },
      ...(eventId ? { eventId } : {}),
    },
    orderBy: { releasedAt: "asc" },
  });

  const close = async (release, reason) => {
    await db.seatRelease.update({ where: { id: release.id }, data: { closedAt: new Date(now), closedReason: reason } });
    summary.closed += 1;
  };

  const releasesByEvent = new Map();
  for (const release of releases) {
    if (!releasesByEvent.has(release.eventId)) releasesByEvent.set(release.eventId, []);
    releasesByEvent.get(release.eventId).push(release);
  }

  for (const [releaseEventId, eventReleases] of releasesByEvent) {
    const event = await db.event.findUnique({
      where: { id: releaseEventId },
      include: { buses: { include: { _count: { select: { registrations: true } } } } },
    });
    if (!event) continue;

    if (!isRegistrationOpen(event)) {
      for (const release of eventReleases) await close(release, "Anmeldung geschlossen");
      continue;
    }

    const freeByBus = new Map(
      event.buses
        .filter((b) => b.enabled && b.capacity !== null)
        .map((b) => [b.id, Math.max(0, b.capacity - b._count.registrations)])
    );

    for (const release of eventReleases) {
      const free = freeByBus.get(release.busId);
      if (free === undefined) {
        await close(release, "Slot nicht verfügbar");
        continue;
      }
      if (free <= 0) {
        await close(release, "wieder belegt");
        continue;
      }
      // Jeder offene freie Platz bekommt höchstens ein laufendes Angebot.
      freeByBus.set(release.busId, free - 1);

      if (release.offeredInterestId) {
        const current = await db.eventInterest.findUnique({ where: { id: release.offeredInterestId } });
        if (current && current.offerStatus === "pending") {
          if (now - current.offeredAt.getTime() < OFFER_VALID_MS) {
            summary.waiting += 1;
            continue;
          }
          await db.eventInterest.update({ where: { id: current.id }, data: { offerStatus: "expired" } });
        }
      }

      let offered = false;
      for (let attempt = 0; attempt < 5 && !offered; attempt += 1) {
        const candidate = await db.eventInterest.findFirst({
          where: { eventId: releaseEventId, offerStatus: null, OR: [{ busId: null }, { busId: release.busId }] },
          orderBy: { createdAt: "asc" },
        });
        if (!candidate) break;

        const offeredAt = new Date(now);
        const token = crypto.randomBytes(24).toString("hex");
        // Nur übernehmen, wenn kein paralleler Lauf die Person schon angeschrieben hat.
        const claimed = await db.eventInterest.updateMany({
          where: { id: candidate.id, offerStatus: null },
          data: { offerStatus: "pending", offeredAt, offerToken: token },
        });
        if (claimed.count !== 1) continue;

        await db.seatRelease.update({ where: { id: release.id }, data: { offeredInterestId: candidate.id } });
        try {
          await sendOffer(candidate, event, offeredAt, token, send);
        } catch (err) {
          console.error("Wartelisten-Mail fehlgeschlagen:", err.message);
        }
        await notifyFirstOfferOnce(candidate, event, db, send);
        summary.offered += 1;
        offered = true;
      }

      if (!offered) await close(release, "Warteliste ausgeschöpft");
    }
  }

  return summary;
}

export async function getOfferByToken(token, db = prisma) {
  if (!token || typeof token !== "string") return null;
  return db.eventInterest.findUnique({
    where: { offerToken: token },
    include: { event: { select: { title: true, slug: true } } },
  });
}

// "Nein danke": bleibt auf der Liste, bekommt aber kein weiteres automatisches Angebot.
// "Streichen": wird von der Warteliste entfernt. In beiden Fällen ist sofort die nächste Person dran.
export async function respondToOffer(token, response, { db = prisma, send = sendEmail } = {}) {
  const interest = await getOfferByToken(token, db);
  if (!interest) return { status: "unknown" };

  if (response === "remove") {
    await db.eventInterest.delete({ where: { id: interest.id } });
  } else if (interest.offerStatus === "pending") {
    await db.eventInterest.update({ where: { id: interest.id }, data: { offerStatus: "declined" } });
  }

  try {
    await processSeatReleases({ eventId: interest.eventId, db, send });
  } catch (err) {
    console.error("Nachrücken nach Antwort fehlgeschlagen:", err.message);
  }
  return { status: response === "remove" ? "removed" : "declined" };
}
