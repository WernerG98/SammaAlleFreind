import { sendEmail, buildContactEmailHtml } from "./_lib/email.js";

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Methode nicht erlaubt." });
  }

  const { firstName, lastName, email, message } = req.body || {};

  if (!firstName?.trim() || !lastName?.trim() || !isValidEmail(email || "") || !message?.trim()) {
    return res.status(400).json({ error: "Bitte alle Felder gültig ausfüllen." });
  }

  const toEmail = process.env.REPLY_TO_EMAIL;
  if (!toEmail) {
    return res.status(500).json({ error: "Kontaktformular ist serverseitig nicht konfiguriert." });
  }

  await sendEmail({
    to: toEmail,
    subject: `Kontaktanfrage von ${firstName.trim()} ${lastName.trim()}`,
    html: buildContactEmailHtml({
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      email: email.trim(),
      message: message.trim(),
    }),
    replyTo: email.trim(),
  });

  return res.status(200).json({ success: true });
}
