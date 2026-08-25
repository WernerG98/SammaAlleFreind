import { prisma } from "../../_lib/db.js";
import { requireAdmin } from "../../_lib/auth.js";
import { sendEmail, buildNewsletterHtml } from "../../_lib/email.js";

export default async function handler(req, res) {
  const session = await requireAdmin(req, res);
  if (!session) return;

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Methode nicht erlaubt." });
  }

  const { subject, bodyHtml } = req.body || {};
  if (!subject?.trim() || !bodyHtml?.trim()) {
    return res.status(400).json({ error: "Betreff und Inhalt sind erforderlich." });
  }

  const subscribers = await prisma.newsletterSubscriber.findMany();
  const baseUrl = process.env.PUBLIC_BASE_URL || "http://localhost:3000";

  let sent = 0;
  const failed = [];

  for (const subscriber of subscribers) {
    try {
      await sendEmail({
        to: subscriber.email,
        subject: subject.trim(),
        html: buildNewsletterHtml({
          bodyHtml,
          unsubscribeUrl: `${baseUrl}/newsletter/abmelden?token=${subscriber.unsubscribeToken}`,
        }),
      });
      sent += 1;
    } catch (err) {
      failed.push(subscriber.email);
    }
  }

  return res.status(200).json({ sent, total: subscribers.length, failed });
}
