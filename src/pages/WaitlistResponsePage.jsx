import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { api } from "../lib/api.js";
import Skeleton from "../components/Skeleton.jsx";

const ACTIONS = {
  nein: { response: "decline", question: "Möchtest du den freien Platz ablehnen?", confirm: "Ja, Nein danke" },
  streichen: {
    response: "remove",
    question: "Möchtest du dich wirklich von der Warteliste streichen?",
    confirm: "Ja, von der Warteliste streichen",
  },
};

function formatBerlin(iso) {
  const date = new Date(iso);
  return `${date.toLocaleDateString("de-DE", {
    timeZone: "Europe/Berlin",
    weekday: "short",
    day: "2-digit",
    month: "2-digit",
  })}, ${date.toLocaleTimeString("de-DE", { timeZone: "Europe/Berlin", hour: "2-digit", minute: "2-digit" })} Uhr`;
}

export default function WaitlistResponsePage() {
  const [params] = useSearchParams();
  const token = params.get("token");
  const [info, setInfo] = useState(null);
  const [error, setError] = useState("");
  const [pendingAction, setPendingAction] = useState(ACTIONS[params.get("aktion")] ? params.get("aktion") : null);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(null);

  useEffect(() => {
    api
      .post("/register", { action: "waitlist-offer", token })
      .then(setInfo)
      .catch((err) => setError(err.message));
  }, [token]);

  async function confirm(actionKey) {
    setBusy(true);
    setError("");
    try {
      const result = await api.post("/register", {
        action: "waitlist-offer",
        token,
        response: ACTIONS[actionKey].response,
      });
      setDone(result.status === "unknown" ? "unknown" : ACTIONS[actionKey].response);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
      setPendingAction(null);
    }
  }

  if (error) return <p className="text-red-400">{error}</p>;
  if (!info) {
    return (
      <div>
        <Skeleton className="h-7 w-2/3 mb-3" />
        <Skeleton className="h-4 w-full mb-1.5" />
        <Skeleton className="h-4 w-1/2" />
      </div>
    );
  }

  if (done === "remove" || done === "unknown" || !info.onWaitlist) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-bold text-gray-100">Von der Warteliste gestrichen</h1>
        <p className="text-gray-300">
          {done === "remove"
            ? "Du stehst nicht mehr auf der Warteliste und bekommst dazu keine Mails mehr."
            : "Du stehst nicht (mehr) auf dieser Warteliste."}
        </p>
        <Link to="/" className="inline-block text-teal-400 hover:text-teal-300">
          ← Zur Startseite
        </Link>
      </div>
    );
  }

  if (done === "decline") {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-bold text-gray-100">Alles klar, danke!</h1>
        <p className="text-gray-300">
          Wir geben den freien Platz an die nächste Person weiter. Du bleibst auf der Warteliste für{" "}
          <strong>{info.eventTitle}</strong>.
        </p>
        <Link to="/" className="inline-block text-teal-400 hover:text-teal-300">
          ← Zur Startseite
        </Link>
      </div>
    );
  }

  const offerActive = info.offerStatus === "pending";

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-gray-100">
          {offerActive ? "Ein Platz ist frei geworden!" : "Deine Warteliste"}
        </h1>
        <p className="mt-2 text-gray-300">
          Hallo {info.firstName}, {offerActive ? "bei " : "du stehst auf der Warteliste für "}
          <strong>{info.eventTitle}</strong>
          {offerActive
            ? " ist ein Platz frei. Er ist nicht reserviert: Wer sich zuerst anmeldet, bekommt ihn."
            : ". Das Angebot für den freien Platz ist nicht mehr aktiv."}
        </p>
        {offerActive && info.validUntil && (
          <p className="mt-1 text-sm text-gray-400">
            Ohne Antwort geben wir den Hinweis am {formatBerlin(info.validUntil)} an die nächste Person weiter.
          </p>
        )}
      </div>

      {pendingAction && (
        <div className="rounded-xl border border-amber-700 bg-amber-950/40 p-4">
          <p className="font-medium text-amber-200">{ACTIONS[pendingAction].question}</p>
          <div className="mt-3 flex flex-wrap gap-3">
            <button
              type="button"
              disabled={busy}
              onClick={() => confirm(pendingAction)}
              className="rounded-lg bg-amber-600 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-500 disabled:opacity-50"
            >
              {busy ? "Wird gespeichert…" : ACTIONS[pendingAction].confirm}
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={() => setPendingAction(null)}
              className="rounded-lg border border-gray-700 px-4 py-2 text-sm text-gray-300 hover:bg-gray-800"
            >
              Abbrechen
            </button>
          </div>
        </div>
      )}

      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
        <Link
          to={`/veranstaltung/${info.eventSlug}`}
          className="rounded-lg bg-gradient-to-r from-teal-500 to-emerald-500 px-5 py-2.5 text-center text-sm font-semibold text-white shadow-sm hover:from-teal-400 hover:to-emerald-400"
        >
          Jetzt anmelden
        </Link>
        {offerActive && (
          <button
            type="button"
            onClick={() => setPendingAction("nein")}
            className="rounded-lg border border-gray-600 px-5 py-2.5 text-sm font-medium text-gray-200 hover:bg-gray-800"
          >
            Nein danke
          </button>
        )}
        <button
          type="button"
          onClick={() => setPendingAction("streichen")}
          className="rounded-lg border border-red-800 bg-red-950/40 px-5 py-2.5 text-sm font-medium text-red-300 hover:bg-red-900/50"
        >
          Von der Warteliste streichen
        </button>
      </div>
    </div>
  );
}
