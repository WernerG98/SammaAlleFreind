import { useState } from "react";
import { useInstallPrompt } from "../lib/installPrompt.js";

const DISMISS_KEY = "install-card-dismissed";
const DISMISS_DAYS = 90;

function readDismissed() {
  try {
    const value = Number(localStorage.getItem(DISMISS_KEY));
    return Boolean(value) && Date.now() - value < DISMISS_DAYS * 24 * 60 * 60 * 1000;
  } catch {
    return false;
  }
}

function IosHelp() {
  return (
    <p className="mt-2 text-sm text-teal-200">
      Tippe unten auf das Teilen-Symbol <span aria-hidden="true">⬆️</span> und dann auf „Zum Home-Bildschirm“.
    </p>
  );
}

// Karte nach der Anmeldung (Zahlungsseite).
export function InstallAppCard({ className = "" }) {
  const { available, needsIosHelp, install } = useInstallPrompt();
  const [dismissed, setDismissed] = useState(readDismissed);
  const [showIosHelp, setShowIosHelp] = useState(false);

  if (!available || dismissed) return null;

  function dismiss() {
    try {
      localStorage.setItem(DISMISS_KEY, String(Date.now()));
    } catch {
      // ohne Speicher erscheint die Karte beim nächsten Besuch eben wieder
    }
    setDismissed(true);
  }

  return (
    <div className={`rounded-xl border border-teal-800 bg-gradient-to-br from-teal-950/70 to-gray-900 p-5 ${className}`}>
      <div className="flex items-start gap-3">
        <span className="text-3xl leading-none" aria-hidden="true">
          📲
        </span>
        <div className="min-w-0">
          <h2 className="font-semibold text-gray-100">SammaAlleFreind als App</h2>
          <p className="mt-1 text-sm text-gray-300">
            Leg dir die Seite auf den Startbildschirm. Dann bist du mit einem Tipp bei allen Events, ohne zu
            suchen.
          </p>
          {showIosHelp && <IosHelp />}
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={needsIosHelp ? () => setShowIosHelp(true) : install}
              className="rounded-lg bg-gradient-to-r from-teal-500 to-emerald-500 px-4 py-2 text-sm font-semibold text-white shadow-sm shadow-teal-950/30 hover:from-teal-400 hover:to-emerald-400 active:scale-[0.98] transition-all"
            >
              Als App installieren
            </button>
            <button type="button" onClick={dismiss} className="px-1 py-2 text-sm text-gray-400 hover:text-gray-300">
              Nein danke
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Unauffälliger Link für die Fußzeile.
export function InstallAppLink({ className = "" }) {
  const { available, needsIosHelp, install } = useInstallPrompt();
  const [showIosHelp, setShowIosHelp] = useState(false);

  if (!available) return null;

  return (
    <>
      <span aria-hidden="true">·</span>
      <button
        type="button"
        onClick={needsIosHelp ? () => setShowIosHelp((v) => !v) : install}
        className={className}
      >
        📲 Als App installieren
      </button>
      {showIosHelp && (
        <div className="w-full">
          <IosHelp />
        </div>
      )}
    </>
  );
}
