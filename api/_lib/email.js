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

function externalOrganizerNote(event) {
  if (!event?.isExternal) return "";
  return `
    <p style="font-size: 13px; color: #92400e; background: #fffbeb; border: 1px solid #fde68a; border-radius: 8px; padding: 10px 14px; margin-top: 16px;">
      🤝 Diese Veranstaltung wird organisiert von <strong>${event.externalOrganizer || "einem externen Verein"}</strong>.
      ${event.externalContactEmail ? `Bei Fragen dazu wende dich direkt an: <a href="mailto:${event.externalContactEmail}">${event.externalContactEmail}</a>` : ""}
    </p>
  `;
}

export function buildConfirmationEmailHtml({ firstName, event, busName }) {
  return `
    <h2>Deine Zahlung wurde bestätigt</h2>
    <p>Hallo ${firstName},</p>
    <p>
      wir haben deine Zahlung für <strong>${event.title}</strong> erhalten.
      Du bist fest für <strong>${busName}</strong> eingeplant.
    </p>
    <p>Wir freuen uns auf dich!</p>
    <hr />
    <p><strong>Veranstaltung:</strong> ${event.title}<br/>
    <strong>Datum:</strong> ${new Date(event.eventDate).toLocaleDateString("de-DE")}</p>
    ${externalOrganizerNote(event)}
  `;
}

export function buildBusChangedHtml({ firstName, event, busName }) {
  return `
    <h2>Dein Bus wurde geändert</h2>
    <p>Hallo ${firstName},</p>
    <p>
      du bist jetzt für <strong>${busName}</strong> bei <strong>${event.title}</strong> eingeplant.
    </p>
    ${externalOrganizerNote(event)}
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

export function buildInterestConfirmationHtml({ firstName, event }) {
  return `
    <h2>Danke für dein Interesse!</h2>
    <p>Hallo ${firstName},</p>
    <p>
      du stehst jetzt auf der Interessentenliste für <strong>${event.title}</strong>. Sobald es Details und
      Termine gibt, melden wir uns bei dir.
    </p>
    ${externalOrganizerNote(event)}
  `;
}

export function buildWaitlistConfirmationHtml({ firstName, event }) {
  return `
    <h2>Du stehst auf der Warteliste</h2>
    <p>Hallo ${firstName},</p>
    <p>
      aktuell sind bei <strong>${event.title}</strong> leider alle Plätze vergeben. Wir haben dich auf die
      Warteliste gesetzt und melden uns, sobald wieder ein Platz frei wird.
    </p>
    ${externalOrganizerNote(event)}
  `;
}

export function buildRegistrationRemovedHtml({ firstName, event }) {
  return `
    <h2>Deine Anmeldung wurde entfernt</h2>
    <p>Hallo ${firstName},</p>
    <p>
      deine Anmeldung für <strong>${event.title}</strong> wurde von uns aus der Liste entfernt. Falls das aus
      deiner Sicht ein Irrtum ist, melde dich gerne bei uns.
    </p>
    ${externalOrganizerNote(event)}
  `;
}

export function buildInterestRemovedHtml({ firstName, event }) {
  return `
    <h2>Von der Interessentenliste entfernt</h2>
    <p>Hallo ${firstName},</p>
    <p>
      du wurdest von der Interessentenliste für <strong>${event.title}</strong> entfernt. Falls das aus deiner
      Sicht ein Irrtum ist, melde dich gerne bei uns.
    </p>
    ${externalOrganizerNote(event)}
  `;
}

export function buildNewsletterRemovedHtml() {
  return `
    <h2>Aus dem Newsletter entfernt</h2>
    <p>Du wurdest von uns aus dem Newsletter-Verteiler entfernt und erhältst keine weiteren E-Mails mehr von uns.</p>
    <p>Falls das aus deiner Sicht ein Irrtum ist, melde dich gerne bei uns.</p>
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
