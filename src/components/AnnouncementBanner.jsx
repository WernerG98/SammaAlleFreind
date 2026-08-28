import { useState } from "react";

const STORAGE_KEY = "announcement-banner-dismissed-v2";

const MESSAGES = [
  "🐞 Die neue Seite für unsere Veranstaltungen! Schwierigkeiten und Bugs bitte direkt melden, das würde uns sehr helfen. :)",
  "🤝 Wir stellen die Seite gerne auch lokalen Arnstorfer Vereinen und Personen zur Eventplanung zur Verfügung — einfach Kontakt aufnehmen!",
];

export default function AnnouncementBanner() {
  const [dismissed, setDismissed] = useState(() => {
    try {
      return localStorage.getItem(STORAGE_KEY) === "1";
    } catch {
      return false;
    }
  });

  if (dismissed) return null;

  function dismiss() {
    setDismissed(true);
    try {
      localStorage.setItem(STORAGE_KEY, "1");
    } catch {
      // ignore
    }
  }

  const track = [...MESSAGES, ...MESSAGES];

  return (
    <div className="bg-gradient-to-r from-teal-900 via-teal-800 to-stone-800 text-white text-sm">
      <div className="flex items-center gap-3 px-2 py-2">
        <div className="flex-1 overflow-hidden">
          <div className="flex w-max animate-marquee">
            {track.map((msg, i) => (
              <span key={i} className="font-medium whitespace-nowrap pr-16">
                {msg}
              </span>
            ))}
          </div>
        </div>
        <button
          type="button"
          onClick={dismiss}
          aria-label="Schließen"
          className="shrink-0 text-white/80 hover:text-white text-lg leading-none pr-2"
        >
          ✕
        </button>
      </div>
    </div>
  );
}
