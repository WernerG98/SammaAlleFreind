function pad(n) {
  return String(n).padStart(2, "0");
}

function toIcsDate(date) {
  const d = new Date(date);
  return (
    d.getUTCFullYear() +
    pad(d.getUTCMonth() + 1) +
    pad(d.getUTCDate()) +
    "T" +
    pad(d.getUTCHours()) +
    pad(d.getUTCMinutes()) +
    pad(d.getUTCSeconds()) +
    "Z"
  );
}

function escapeIcsText(text) {
  return String(text)
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\r?\n/g, "\\n");
}

function stripHtml(html) {
  return html ? html.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim() : "";
}

const DEFAULT_DURATION_MS = 2 * 60 * 60 * 1000;

export function downloadEventIcs(event) {
  if (!event.eventDate) return;

  const start = new Date(event.eventDate);
  const end = new Date(start.getTime() + DEFAULT_DURATION_MS);
  const pageUrl = `${window.location.origin}/veranstaltung/${event.slug}`;

  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//SammaAlleFreind//Events//DE",
    "BEGIN:VEVENT",
    `UID:${event.id}@sammaallefreind.de`,
    `DTSTAMP:${toIcsDate(new Date())}`,
    `DTSTART:${toIcsDate(start)}`,
    `DTEND:${toIcsDate(end)}`,
    `SUMMARY:${escapeIcsText(event.title)}`,
    ...(event.description ? [`DESCRIPTION:${escapeIcsText(stripHtml(event.description))}`] : []),
    `URL:${pageUrl}`,
    "END:VEVENT",
    "END:VCALENDAR",
  ];

  const blob = new Blob([lines.join("\r\n")], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${event.slug}.ics`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
