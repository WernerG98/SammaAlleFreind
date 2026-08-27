import { Resend } from "resend";

const apiKey = process.env.RESEND_API_KEY;
const resend = apiKey ? new Resend(apiKey) : null;
const fromEmail = process.env.FROM_EMAIL || "Vereins-Events <onboarding@resend.dev>";
const replyToEmail = process.env.REPLY_TO_EMAIL || undefined;

export async function sendEmail({ to, subject, html, replyTo }) {
  if (!resend) {
    console.log("=== [DEV] E-Mail nicht verschickt (kein RESEND_API_KEY gesetzt) ===");
    console.log("An:", to);
    console.log("Betreff:", subject);
    console.log("Inhalt:\n", html);
    console.log("=======================================================");
    return { devFallback: true };
  }

  return resend.emails.send({ from: fromEmail, to, subject, html, replyTo: replyTo || replyToEmail });
}

export function buildConfirmationEmailHtml({ firstName, event, busName }) {
  return `
    <h2>Deine Zahlung wurde bestätigt</h2>
    <p>Hallo ${firstName},</p>
    <p>
      wir haben deine Zahlung für <strong>${event.title}</strong> erhalten.
      Du bist fest für den Bus <strong>${busName}</strong> eingeplant.
    </p>
    <p>Wir freuen uns auf dich!</p>
    <hr />
    <p><strong>Veranstaltung:</strong> ${event.title}<br/>
    <strong>Datum:</strong> ${new Date(event.eventDate).toLocaleDateString("de-DE")}</p>
  `;
}

export function buildContactEmailHtml({ firstName, lastName, email, message }) {
  return `
    <h2>Neue Kontaktanfrage</h2>
    <p><strong>Name:</strong> ${firstName} ${lastName}</p>
    <p><strong>E-Mail:</strong> ${email}</p>
    <p><strong>Nachricht:</strong><br/>${message.replace(/\n/g, "<br/>")}</p>
  `;
}

export function buildNewsletterOptInHtml({ unsubscribeUrl }) {
  return `
    <h2>Newsletter-Anmeldung bestätigt</h2>
    <p>Du erhältst ab jetzt Neuigkeiten zu kommenden Veranstaltungen per E-Mail.</p>
    <p style="font-size: 12px; color: #666;">
      Falls du dich nicht selbst angemeldet hast oder keine Mails mehr erhalten möchtest, kannst du dich
      <a href="${unsubscribeUrl}">hier jederzeit wieder abmelden</a>.
    </p>
  `;
}

export function buildNewsletterHtml({ bodyHtml, unsubscribeUrl }) {
  return `
    ${bodyHtml}
    <hr />
    <p style="font-size: 12px; color: #666;">
      Du erhältst diese E-Mail, weil du dich für unseren Newsletter angemeldet hast.
      <a href="${unsubscribeUrl}">Hier abmelden</a>.
    </p>
  `;
}
