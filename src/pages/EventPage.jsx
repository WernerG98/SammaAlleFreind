import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { api } from "../lib/api.js";
import Honeypot from "../components/Honeypot.jsx";
import AlreadyRegisteredBox from "../components/AlreadyRegisteredBox.jsx";

export default function EventPage() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [event, setEvent] = useState(null);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [interestDone, setInterestDone] = useState(false);
  const [showWaitlistForm, setShowWaitlistForm] = useState(false);
  const [waitlistDone, setWaitlistDone] = useState(false);
  const [passwordInput, setPasswordInput] = useState("");
  const [accessPassword, setAccessPassword] = useState("");
  const [unlockError, setUnlockError] = useState("");
  const [unlocking, setUnlocking] = useState(false);
  const [gasModalOpen, setGasModalOpen] = useState(false);
  const [showVollgasImage, setShowVollgasImage] = useState(false);
  const [vollgasCountdown, setVollgasCountdown] = useState(5);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    busId: "",
    newsletterOptIn: false,
    website: "",
  });

  useEffect(() => {
    api
      .get(`/events/${slug}`)
      .then(setEvent)
      .catch((err) => setError(err.message));
  }, [slug]);

  async function handleUnlock(e) {
    e.preventDefault();
    setUnlockError("");
    setUnlocking(true);
    try {
      const unlocked = await api.get(`/events/${slug}?password=${encodeURIComponent(passwordInput)}`);
      if (unlocked.locked) {
        setUnlockError("Falsches Passwort.");
      } else {
        setAccessPassword(passwordInput);
        setEvent(unlocked);
      }
    } catch (err) {
      setUnlockError(err.message);
    } finally {
      setUnlocking(false);
    }
  }

  async function submitRegistration() {
    setError("");
    setSubmitting(true);
    try {
      const result = await api.post("/register", { eventId: event.id, ...form, password: accessPassword });
      if (result.interest) {
        setInterestDone(true);
      } else {
        navigate(`/anmeldung/${result.id}/zahlung`);
      }
    } catch (err) {
      if (err.data?.registrationId) {
        navigate(`/anmeldung/${err.data.registrationId}/zahlung`);
        return;
      }
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (event?.slug === "ausflug-haslinger-hof-2026") {
      setGasModalOpen(true);
      return;
    }
    await submitRegistration();
  }

  function handleVollgas() {
    setGasModalOpen(false);
    setVollgasCountdown(5);
    setShowVollgasImage(true);
  }

  useEffect(() => {
    if (!showVollgasImage) return;
    if (vollgasCountdown <= 0) {
      setShowVollgasImage(false);
      submitRegistration();
      return;
    }
    const timer = setTimeout(() => setVollgasCountdown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [showVollgasImage, vollgasCountdown]);

  async function handleWaitlistSubmit(e) {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      await api.post("/register", { eventId: event.id, ...form, waitlist: true, password: accessPassword });
      setWaitlistDone(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  if (error && !event) {
    return <p className="max-w-lg mx-auto px-4 py-12 text-red-400">{error}</p>;
  }
  if (!event) {
    return <p className="max-w-lg mx-auto px-4 py-12 text-gray-500">Lade...</p>;
  }
  if (event.locked) {
    return (
      <div className="max-w-lg mx-auto px-4 py-12">
        <h1 className="text-2xl font-bold text-gray-100">{event.title}</h1>
        <p className="mt-2 text-amber-400 font-semibold">🔒 Vorabzugang — nur mit Passwort sichtbar.</p>

        <form onSubmit={handleUnlock} className="mt-8 space-y-4 bg-gray-900 border border-gray-800 rounded-xl p-6 shadow-sm">
          <div>
            <label className="block text-sm font-medium mb-1 text-gray-300">Passwort</label>
            <input
              required
              type="password"
              autoFocus
              className="w-full border border-gray-700 bg-gray-800 text-gray-100 rounded-lg px-3 py-2 focus:outline-none focus:border-teal-500"
              value={passwordInput}
              onChange={(e) => setPasswordInput(e.target.value)}
            />
          </div>
          {unlockError && <p className="text-sm text-red-400">{unlockError}</p>}
          <button
            type="submit"
            disabled={unlocking}
            className="w-full bg-amber-600 hover:bg-amber-500 text-white rounded-lg py-2 font-medium disabled:opacity-50 transition-colors"
          >
            {unlocking ? "Wird geprüft…" : "Freischalten"}
          </button>
        </form>
      </div>
    );
  }
  if (event.comingSoon) {
    return (
      <div className="max-w-lg mx-auto px-4 py-12">
        <h1 className="text-2xl font-bold text-gray-100">{event.title}</h1>
        {event.isExternal && (
          <p className="mt-2 text-xs text-amber-300 bg-amber-950/40 border border-amber-800 rounded-lg px-3 py-2 inline-block">
            🤝 Veranstaltet von {event.externalOrganizer || "einem externen Verein"}
            {event.externalContactEmail && (
              <>
                {" "}
                — Kontakt:{" "}
                <a href={`mailto:${event.externalContactEmail}`} className="underline">
                  {event.externalContactEmail}
                </a>
              </>
            )}
          </p>
        )}
        <p className="mt-2 text-teal-400 font-semibold">✨ Coming Soon — Details folgen in Kürze.</p>
        {event.description && (
          <div className="mt-4 text-gray-300" dangerouslySetInnerHTML={{ __html: event.description }} />
        )}

        {interestDone ? (
          <div className="mt-8 bg-emerald-950/40 border border-emerald-800 rounded-lg p-5 text-emerald-300">
            Danke! Du stehst jetzt auf der Interessentenliste — wir melden uns, sobald es Details gibt.
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-8 space-y-4 bg-gray-900 border border-gray-800 rounded-xl p-6 shadow-sm">
            <Honeypot value={form.website} onChange={(e) => setForm({ ...form, website: e.target.value })} />
            <h2 className="font-semibold text-gray-100">Interesse bekunden</h2>
            <p className="text-sm text-gray-400">
              Trag dich schon jetzt unverbindlich auf die Liste ein, wir informieren dich, sobald es losgeht.
            </p>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-300">Vorname</label>
                <input
                  required
                  className="w-full border border-gray-700 bg-gray-800 text-gray-100 rounded-lg px-3 py-2 focus:outline-none focus:border-teal-500"
                  value={form.firstName}
                  onChange={(e) => setForm({ ...form, firstName: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-300">Name</label>
                <input
                  required
                  className="w-full border border-gray-700 bg-gray-800 text-gray-100 rounded-lg px-3 py-2 focus:outline-none focus:border-teal-500"
                  value={form.lastName}
                  onChange={(e) => setForm({ ...form, lastName: e.target.value })}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1 text-gray-300">E-Mail-Adresse</label>
              <input
                required
                type="email"
                className="w-full border border-gray-700 bg-gray-800 text-gray-100 rounded-lg px-3 py-2 focus:outline-none focus:border-teal-500"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
            </div>

            {error && <p className="text-sm text-red-400">{error}</p>}

            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-teal-600 hover:bg-teal-500 text-white rounded-lg py-2 font-medium disabled:opacity-50 transition-colors"
            >
              {submitting ? "Wird gesendet…" : "Interesse bekunden"}
            </button>
          </form>
        )}
      </div>
    );
  }

  const availableBuses = event.buses.filter((b) => b.enabled && (b.remaining === null || b.remaining > 0));
  const allFull = availableBuses.length === 0;
  const deadlinePassed = !event.registrationOpen;

  return (
    <div className="max-w-lg mx-auto px-4 py-12">
      {event.imageUrl && (
        <img
          src={event.imageUrl}
          alt={`Flyer: ${event.title}`}
          className="w-full rounded-xl shadow-md mb-6 object-cover"
        />
      )}

      <h1 className="text-2xl font-bold text-gray-100">{event.title}</h1>
      {event.isExternal && (
        <p className="mt-2 text-xs text-amber-300 bg-amber-950/40 border border-amber-800 rounded-lg px-3 py-2 inline-block">
          🤝 Veranstaltet von {event.externalOrganizer || "einem externen Verein"}
          {event.externalContactEmail && (
            <>
              {" "}
              — Kontakt:{" "}
              <a href={`mailto:${event.externalContactEmail}`} className="underline">
                {event.externalContactEmail}
              </a>
            </>
          )}
        </p>
      )}
      <p className="text-sm text-gray-400 mt-1">
        {new Date(event.eventDate).toLocaleDateString("de-DE", {
          timeZone: "Europe/Berlin",
          weekday: "long",
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
        })}
        ,{" "}
        {new Date(event.eventDate).toLocaleTimeString("de-DE", {
          timeZone: "Europe/Berlin",
          hour: "2-digit",
          minute: "2-digit",
        })}{" "}
        Uhr
      </p>
      {event.registrationDeadline && !deadlinePassed && (
        <p className="text-sm text-gray-400">
          Anmeldeschluss:{" "}
          {new Date(event.registrationDeadline).toLocaleDateString("de-DE", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
          })}
        </p>
      )}
      {event.description && (
        <div className="mt-4 text-gray-300" dangerouslySetInnerHTML={{ __html: event.description }} />
      )}

      <AlreadyRegisteredBox slug={event.slug} />

      {deadlinePassed ? (
        <div className="mt-8 bg-gray-900 border border-gray-800 rounded-xl p-6 shadow-sm">
          <p className="text-red-400 font-medium">Die Anmeldefrist für diese Veranstaltung ist abgelaufen.</p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="mt-8 space-y-4 bg-gray-900 border border-gray-800 rounded-xl p-6 shadow-sm">
          <Honeypot value={form.website} onChange={(e) => setForm({ ...form, website: e.target.value })} />
          <h2 className="font-semibold text-gray-100">Anmeldung</h2>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1 text-gray-300">Vorname</label>
              <input
                required
                className="w-full border border-gray-700 bg-gray-800 text-gray-100 rounded-lg px-3 py-2 focus:outline-none focus:border-teal-500"
                value={form.firstName}
                onChange={(e) => setForm({ ...form, firstName: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1 text-gray-300">Name</label>
              <input
                required
                className="w-full border border-gray-700 bg-gray-800 text-gray-100 rounded-lg px-3 py-2 focus:outline-none focus:border-teal-500"
                value={form.lastName}
                onChange={(e) => setForm({ ...form, lastName: e.target.value })}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1 text-gray-300">E-Mail-Adresse</label>
            <input
              required
              type="email"
              className="w-full border border-gray-700 bg-gray-800 text-gray-100 rounded-lg px-3 py-2 focus:outline-none focus:border-teal-500"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2 text-gray-300">Bus</label>
            {allFull && <p className="text-sm text-red-400 mb-2">Alle Busse sind ausgebucht.</p>}
            <div className="grid grid-cols-2 gap-2">
              {event.buses.map((bus) => {
                const full = bus.enabled && bus.remaining === 0;
                const comingSoonBus = !bus.enabled;
                const disabled = full || comingSoonBus;
                const selected = form.busId === bus.id;
                return (
                  <button
                    type="button"
                    key={bus.id}
                    disabled={disabled}
                    onClick={() => setForm({ ...form, busId: bus.id })}
                    className={`rounded-lg border-2 px-3 py-2 text-left text-sm transition-colors ${
                      disabled
                        ? "bg-gray-800 border-gray-700 text-gray-500 cursor-not-allowed"
                        : selected
                          ? "border-teal-500 bg-teal-950/40 text-teal-300"
                          : "border-gray-700 text-gray-300 hover:border-teal-600"
                    }`}
                  >
                    <span className="font-medium flex items-center gap-1">
                      {disabled && <span aria-hidden="true">{comingSoonBus ? "⏳" : "🔒"}</span>}
                      {bus.name}
                    </span>
                    <span className="block text-xs mt-0.5">
                      {comingSoonBus
                        ? "Bei genügend Nachfrage"
                        : full
                          ? "ausgebucht"
                          : bus.remaining === null
                            ? "unbegrenzt verfügbar"
                            : `noch ${bus.remaining} Plätze frei`}
                    </span>
                  </button>
                  );
                })}
              </div>
          </div>

          <div>
            <label className="flex items-center gap-2 text-sm text-gray-300">
              <input
                type="checkbox"
                checked={form.newsletterOptIn}
                onChange={(e) => setForm({ ...form, newsletterOptIn: e.target.checked })}
              />
              Ich möchte den Newsletter zu zukünftigen Veranstaltungen erhalten.
            </label>
            {form.newsletterOptIn && (
              <p className="text-xs text-gray-500 mt-1 ml-6">
                Die automatische Bestätigungsmail landet manchmal im Spam-Ordner — bitte dort auch kurz
                nachschauen.
              </p>
            )}
          </div>

          {event.pricePerPerson ? (
            <div className="bg-amber-950/40 border border-amber-800 rounded-lg p-3 text-xs text-amber-300 space-y-2">
              <p>
                Das Geld wird nur bis 14 Tage vor der Veranstaltung zurückerstattet. Danach ist eine
                Rückerstattung nicht mehr möglich.
              </p>
              <p>
                Dein Platz ist erst reserviert, sobald deine Zahlung bei uns eingegangen und bestätigt ist — bis
                dahin ist noch kein Platz für dich fest eingeplant.
              </p>
              <label className="flex items-center gap-2 font-medium pt-1">
                <input
                  type="checkbox"
                  checked={acceptedTerms}
                  onChange={(e) => setAcceptedTerms(e.target.checked)}
                />
                Ich habe das gelesen und bin einverstanden.
              </label>
            </div>
          ) : (
            <div className="bg-emerald-950/40 border border-emerald-800 rounded-lg p-3 text-xs text-emerald-300">
              Diese Veranstaltung ist kostenlos — dein Platz ist direkt nach der Anmeldung fest für dich
              reserviert.
            </div>
          )}

          {error && <p className="text-sm text-red-400">{error}</p>}

          <button
            type="submit"
            disabled={
              submitting ||
              availableBuses.length === 0 ||
              !form.busId ||
              (Boolean(event.pricePerPerson) && !acceptedTerms)
            }
            className="w-full bg-teal-600 hover:bg-teal-500 text-white rounded-lg py-2 font-medium disabled:opacity-50 transition-colors"
          >
            {submitting ? "Wird gesendet…" : "Anmelden"}
          </button>
        </form>
      )}

      {!deadlinePassed && allFull && (
        <>
          {waitlistDone ? (
            <div className="mt-4 bg-emerald-950/40 border border-emerald-800 rounded-xl p-5 text-emerald-300">
              Danke! Du stehst jetzt auf der Warteliste — wir melden uns, sobald ein Platz frei wird.
            </div>
          ) : !showWaitlistForm ? (
            <button
              type="button"
              onClick={() => setShowWaitlistForm(true)}
              className="mt-4 w-full text-center text-sm text-teal-400 hover:text-teal-300 underline"
            >
              Alle Plätze vergeben? Jetzt auf die Warteliste setzen
            </button>
          ) : (
            <form onSubmit={handleWaitlistSubmit} className="mt-4 space-y-4 bg-gray-900 border border-gray-800 rounded-xl p-6 shadow-sm">
              <Honeypot value={form.website} onChange={(e) => setForm({ ...form, website: e.target.value })} />
              <h2 className="font-semibold text-gray-100">Auf die Warteliste setzen</h2>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1 text-gray-300">Vorname</label>
                  <input
                    required
                    className="w-full border border-gray-700 bg-gray-800 text-gray-100 rounded-lg px-3 py-2 focus:outline-none focus:border-teal-500"
                    value={form.firstName}
                    onChange={(e) => setForm({ ...form, firstName: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 text-gray-300">Name</label>
                  <input
                    required
                    className="w-full border border-gray-700 bg-gray-800 text-gray-100 rounded-lg px-3 py-2 focus:outline-none focus:border-teal-500"
                    value={form.lastName}
                    onChange={(e) => setForm({ ...form, lastName: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1 text-gray-300">E-Mail-Adresse</label>
                <input
                  required
                  type="email"
                  className="w-full border border-gray-700 bg-gray-800 text-gray-100 rounded-lg px-3 py-2 focus:outline-none focus:border-teal-500"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                />
              </div>

              {error && <p className="text-sm text-red-400">{error}</p>}

              <button
                type="submit"
                disabled={submitting}
                className="w-full bg-teal-600 hover:bg-teal-500 text-white rounded-lg py-2 font-medium disabled:opacity-50 transition-colors"
              >
                {submitting ? "Wird gesendet…" : "Auf die Warteliste setzen"}
              </button>
            </form>
          )}
        </>
      )}

      {gasModalOpen && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 px-4">
          <div className="bg-gray-900 border border-gray-800 rounded-xl shadow-xl max-w-sm w-full p-6 text-center">
            <h3 className="font-semibold text-lg mb-4 text-gray-100">🚌💨 Wie viel Gas willst du geben?</h3>
            <div className="flex flex-col gap-3">
              <button
                type="button"
                onClick={handleVollgas}
                className="w-full bg-red-600 hover:bg-red-500 text-white rounded-lg py-3 font-bold text-lg transition-colors"
              >
                Vollgas
              </button>
              <button
                type="button"
                disabled
                title="Nicht auswählbar."
                className="w-full bg-gray-800 text-gray-500 rounded-lg py-3 font-medium cursor-not-allowed"
              >
                Kein Gas
              </button>
            </div>
          </div>
        </div>
      )}

      {showVollgasImage && (
        <div className="fixed inset-0 bg-black/80 flex flex-col items-center justify-center z-50 px-4">
          <p className="text-white/80 text-sm font-semibold mb-2">
            Weiterleitung in {vollgasCountdown}s…
          </p>
          <p className="text-white text-2xl font-extrabold mb-4">Gute Wahl! 😎</p>
          <img
            src="/Vollgas.jpg"
            alt="Vollgas"
            className="max-w-full max-h-[70vh] rounded-xl shadow-2xl"
          />
        </div>
      )}
    </div>
  );
}
