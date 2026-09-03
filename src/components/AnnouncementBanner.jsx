import { useEffect, useState } from "react";
import { api } from "../lib/api.js";

const STORAGE_KEY = "announcement-banner-dismissed-v2";
const ROTATE_INTERVAL_MS = 6000;
const FADE_DURATION_MS = 300;

const DEFAULT_MESSAGES = [
  "🐞 Die neue Seite für unsere Veranstaltungen! Schwierigkeiten und Bugs bitte direkt melden, das würde uns sehr helfen. :)",
  "🤝 Wir stellen die Seite gerne auch lokalen Arnstorfer Vereinen und Personen zur Eventplanung zur Verfügung — einfach Kontakt aufnehmen!",
];

export default function AnnouncementBanner() {
  const [messages, setMessages] = useState(DEFAULT_MESSAGES);
  const [index, setIndex] = useState(0);
  const [visible, setVisible] = useState(true);
  const [dismissed, setDismissed] = useState(() => {
    try {
      return localStorage.getItem(STORAGE_KEY) === "1";
    } catch {
      return false;
    }
  });

  useEffect(() => {
    api
      .get("/announcement")
      .then((data) => {
        if (Array.isArray(data.messages) && data.messages.length > 0) {
          setMessages(data.messages);
          setIndex(0);
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (messages.length <= 1) return;
    const timer = setInterval(() => {
      setVisible(false);
      setTimeout(() => {
        setIndex((i) => (i + 1) % messages.length);
        setVisible(true);
      }, FADE_DURATION_MS);
    }, ROTATE_INTERVAL_MS);
    return () => clearInterval(timer);
  }, [messages]);

  if (dismissed) return null;

  function dismiss() {
    setDismissed(true);
    try {
      localStorage.setItem(STORAGE_KEY, "1");
    } catch {
      // ignore
    }
  }

  return (
    <div className="bg-gradient-to-r from-teal-900 via-teal-800 to-stone-800 text-white text-sm">
      <div className="flex items-center gap-3 px-3 sm:px-4 py-2.5">
        <p
          className="flex-1 min-w-0 font-medium text-center transition-opacity duration-300 motion-reduce:transition-none"
          style={{ opacity: visible ? 1 : 0 }}
        >
          {messages[index]}
        </p>
        {messages.length > 1 && (
          <div className="flex items-center gap-1.5 shrink-0">
            {messages.map((_, i) => (
              <span
                key={i}
                aria-hidden="true"
                className={`h-1.5 w-1.5 rounded-full transition-colors ${i === index ? "bg-white" : "bg-white/30"}`}
              />
            ))}
          </div>
        )}
        <button
          type="button"
          onClick={dismiss}
          aria-label="Schließen"
          className="shrink-0 text-white/80 hover:text-white text-lg leading-none"
        >
          ✕
        </button>
      </div>
    </div>
  );
}
