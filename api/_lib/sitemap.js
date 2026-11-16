import { prisma } from "./db.js";

const STATIC_PATHS = ["/", "/impressum", "/datenschutz"];

function escapeXml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

// Private Veranstaltungen (nur mit Passwort erreichbar) und geschlossene kommen nicht hinein.
export async function buildSitemapXml() {
  const baseUrl = process.env.PUBLIC_BASE_URL || "https://sammaallefreind.de";

  const events = await prisma.event.findMany({
    where: { isOpen: true, isPrivate: false },
    select: { slug: true },
    orderBy: { eventDate: "asc" },
  });

  const urls = [
    ...STATIC_PATHS.map((path) => `${baseUrl}${path}`),
    ...events.map((e) => `${baseUrl}/veranstaltung/${encodeURIComponent(e.slug)}`),
  ];

  return (
    '<?xml version="1.0" encoding="UTF-8"?>\n' +
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' +
    urls.map((url) => `  <url><loc>${escapeXml(url)}</loc></url>`).join("\n") +
    "\n</urlset>\n"
  );
}
