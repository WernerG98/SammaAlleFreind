import { mediumUrlFor } from "./blob.js";

const SITE_NAME = "SammaAlleFreind";
const DEFAULT_DESCRIPTION =
  "Kampf gegen Langeweile in Arnstorf und Umgebung: Anmeldung, Bus-Platzverwaltung und Bezahlung für unsere Veranstaltungen.";

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function stripHtml(html) {
  return String(html ?? "")
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function truncate(text, max) {
  return text.length > max ? `${text.slice(0, max - 1).trimEnd()}…` : text;
}

function absoluteImageUrl(imageUrl, baseUrl) {
  if (!imageUrl || imageUrl.startsWith("data:")) return null;
  return imageUrl.startsWith("/") ? `${baseUrl}${encodeURI(imageUrl)}` : imageUrl;
}

// HTML nur für Link-Vorschau-Crawler (WhatsApp, Telegram, ...): die Seite selbst
// ist eine SPA und liefert diesen Bots sonst immer dieselben Standard-Meta-Tags.
export function buildEventOgHtml(event, slug) {
  const baseUrl = process.env.PUBLIC_BASE_URL || "https://sammaallefreind.de";
  const pageUrl = `${baseUrl}/veranstaltung/${encodeURIComponent(slug)}`;
  const locked = event && (event.isPrivate || event.earlyAccessEnabled);

  let title = SITE_NAME;
  let description = DEFAULT_DESCRIPTION;
  let image = null;

  if (event && event.isOpen) {
    title = `${event.title} | ${SITE_NAME}`;
    if (locked) {
      description = "Diese Veranstaltung ist nur mit Passwort zugänglich.";
    } else {
      const parts = [];
      if (event.comingSoon) {
        parts.push("Coming Soon");
      } else if (event.eventDate) {
        const date = new Date(event.eventDate);
        parts.push(
          `${date.toLocaleDateString("de-DE", {
            timeZone: "Europe/Berlin",
            weekday: "short",
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
          })}, ${date.toLocaleTimeString("de-DE", {
            timeZone: "Europe/Berlin",
            hour: "2-digit",
            minute: "2-digit",
          })} Uhr`
        );
      }
      if (event.pricePerPerson) {
        parts.push(`${Number(event.pricePerPerson).toFixed(2).replace(".", ",")} € pro Person`);
      }
      const intro = parts.join(" · ");
      const body = truncate(stripHtml(event.description), 160);
      description = [intro, body].filter(Boolean).join(" – ") || DEFAULT_DESCRIPTION;
      image =
        absoluteImageUrl(mediumUrlFor(event.imageUrl), baseUrl) || absoluteImageUrl(event.imageUrl, baseUrl);
    }
  }

  const hasEventImage = Boolean(image);
  const ogImage = image || `${baseUrl}/Logo.png`;

  return `<!doctype html>
<html lang="de">
  <head>
    <meta charset="UTF-8" />
    <title>${escapeHtml(title)}</title>
    <meta name="description" content="${escapeHtml(description)}" />
    <meta property="og:type" content="website" />
    <meta property="og:site_name" content="${SITE_NAME}" />
    <meta property="og:title" content="${escapeHtml(title)}" />
    <meta property="og:description" content="${escapeHtml(description)}" />
    <meta property="og:image" content="${escapeHtml(ogImage)}" />
    <meta property="og:url" content="${escapeHtml(pageUrl)}" />
    <meta property="og:locale" content="de_DE" />
    <meta name="twitter:card" content="${hasEventImage ? "summary_large_image" : "summary"}" />
    <meta name="twitter:title" content="${escapeHtml(title)}" />
    <meta name="twitter:description" content="${escapeHtml(description)}" />
    <meta name="twitter:image" content="${escapeHtml(ogImage)}" />
  </head>
  <body>
    <h1>${escapeHtml(title)}</h1>
    <p>${escapeHtml(description)}</p>
    <p><a href="${escapeHtml(pageUrl)}">Zur Veranstaltung</a></p>
  </body>
</html>
`;
}
