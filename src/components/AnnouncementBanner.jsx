import { useState } from "react";

const STORAGE_KEY = "announcement-banner-dismissed-v1";

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

  return (
    <div className="bg-gradient-to-r from-teal-900 via-teal-800 to-stone-800 text-white text-sm">
      <div className="max-w-3xl mx-auto px-4 py-2 flex items-center justify-between gap-3">
        <p className="font-medium">
          Die neue Seite für unsere Veranstaltungen! Bugs bitte direkt melden, das würde uns sehr helfen. :)
        </p>
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
