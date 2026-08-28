import crypto from "node:crypto";
import { prisma } from "./_lib/db.js";
import { requireAdmin } from "./_lib/auth.js";
import { sendEmail, buildNewsletterOptInHtml, buildNewsletterRemovedHtml } from "./_lib/email.js";

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export default async function handler(req, res) {
  if (req.method === "GET") {
    const { token } = req.query;

    if (!token) {
      // Admin-Übersicht aller Abonnenten
      const session = await requireAdmin(req, res, { fullOnly: true });
      if (!session) return;
      const subscribers = await prisma.newsletterSubscriber.findMany({ orderBy: { createdAt: "asc" } });
      return res.status(200).json(subscribers);
    }

    const subscriber = await prisma.newsletterSubscriber.findUnique({
      where: { unsubscribeToken: token },
    });

    if (!subscriber) {
      return res.status(404).json({ error: "Ungültiger oder bereits verwendeter Link." });
    }

    await prisma.newsletterSubscriber.delete({ where: { id: subscriber.id } });
    return res.status(200).json({ success: true });
  }

  if (req.method === "DELETE") {
    const session = await requireAdmin(req, res, { fullOnly: true });
    if (!session) return;

    const { id } = req.query;
    const subscriber = await prisma.newsletterSubscriber.findUnique({ where: { id } });
    if (!subscriber) {
      return res.status(404).json({ error: "Abonnent nicht gefunden." });
    }

    await prisma.newsletterSubscriber.delete({ where: { id } });
    await sendEmail({
      to: subscriber.email,
      subject: "Du wurdest aus dem Newsletter entfernt",
      html: buildNewsletterRemovedHtml(),
    });

    return res.status(200).json({ success: true });
  }

  if (req.method === "POST") {
    const { email, website } = req.body || {};

    if (website) {
      return res.status(400).json({ error: "Ungültige Anfrage." });
    }

    if (!isValidEmail(email || "")) {
      return res.status(400).json({ error: "Bitte eine gültige E-Mail-Adresse angeben." });
    }

    const normalizedEmail = email.toLowerCase().trim();

    const existing = await prisma.newsletterSubscriber.findUnique({ where: { email: normalizedEmail } });
    const subscriber =
      existing ||
      (await prisma.newsletterSubscriber.create({
        data: { email: normalizedEmail, unsubscribeToken: crypto.randomBytes(24).toString("hex") },
      }));

    const baseUrl = process.env.PUBLIC_BASE_URL || "http://localhost:3000";
    await sendEmail({
      to: normalizedEmail,
      subject: "Newsletter-Anmeldung bestätigt",
      html: buildNewsletterOptInHtml({
        unsubscribeUrl: `${baseUrl}/newsletter/abmelden?token=${subscriber.unsubscribeToken}`,
      }),
    });

    return res.status(201).json({ success: true });
  }

  return res.status(405).json({ error: "Methode nicht erlaubt." });
}
