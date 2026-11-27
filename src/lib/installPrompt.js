import { useEffect, useState } from "react";

// Chrome/Edge/Android melden per "beforeinstallprompt", dass die Seite installierbar ist.
// Das Ereignis kommt nur einmal kurz nach dem Laden, deshalb wird es hier gleich beim
// Start der App abgefangen und für spätere Knöpfe aufgehoben.
let deferredPrompt = null;
const listeners = new Set();
const notify = () => listeners.forEach((listener) => listener());

if (typeof window !== "undefined") {
  window.addEventListener("beforeinstallprompt", (event) => {
    event.preventDefault();
    deferredPrompt = event;
    notify();
  });
  window.addEventListener("appinstalled", () => {
    deferredPrompt = null;
    notify();
  });
}

function isStandalone() {
  return window.matchMedia?.("(display-mode: standalone)").matches || window.navigator.standalone === true;
}

// iPhone/iPad haben keinen Installationsdialog, dort gibt es nur "Zum Home-Bildschirm".
function isIos() {
  const ua = window.navigator.userAgent;
  return /iPad|iPhone|iPod/.test(ua) || (window.navigator.platform === "MacIntel" && window.navigator.maxTouchPoints > 1);
}

export function useInstallPrompt() {
  const [, rerender] = useState(0);

  useEffect(() => {
    const listener = () => rerender((n) => n + 1);
    listeners.add(listener);
    return () => listeners.delete(listener);
  }, []);

  const standalone = isStandalone();
  const ios = !standalone && !deferredPrompt && isIos();

  return {
    available: !standalone && (Boolean(deferredPrompt) || ios),
    needsIosHelp: ios,
    async install() {
      if (!deferredPrompt) return false;
      const promptEvent = deferredPrompt;
      promptEvent.prompt();
      const { outcome } = await promptEvent.userChoice;
      deferredPrompt = null;
      notify();
      return outcome === "accepted";
    },
  };
}
