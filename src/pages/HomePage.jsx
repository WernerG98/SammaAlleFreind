import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../lib/api.js";
import ContactForm from "../components/ContactForm.jsx";
import NewsletterSignup from "../components/NewsletterSignup.jsx";

export default function HomePage() {
  const [events, setEvents] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    api
      .get("/events")
      .then(setEvents)
      .catch((err) => setError(err.message));
  }, []);

  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <h1 className="text-2xl font-bold mb-2 text-teal-900">🎉 Kommende Veranstaltungen</h1>
      <p className="text-sm text-gray-600 mb-8">
        Die Bezahlung erfolgt per PayPal. Bei anderen Zahlungsmethoden melde dich bitte ganz normal wie gewohnt
        an und schreib uns anschließend über das Kontaktformular weiter unten. Bitte beachte: Damit wir deine
        Zahlung zuordnen können, gib beim Bezahlen als Kommentar deinen Namen an, falls er nicht ohnehin
        ersichtlich ist.
      </p>

      {error && <p className="text-red-600">{error}</p>}
      {!events && !error && <p className="text-gray-500">Lade...</p>}
      {events?.length === 0 && <p className="text-gray-500">Aktuell sind keine Veranstaltungen geplant.</p>}

      <div className="space-y-4">
        {events?.map((event) => {
          if (event.locked) {
            return (
              <Link
                key={event.id}
                to={`/veranstaltung/${event.slug}`}
                className="relative block bg-gradient-to-br from-amber-50 to-white border-2 border-amber-300 rounded-xl pl-6 pr-5 py-5 shadow-md hover:shadow-xl hover:border-amber-500 hover:-translate-y-0.5 transition-all overflow-hidden"
              >
                <span className="absolute left-0 top-0 bottom-0 w-1.5 bg-amber-500" aria-hidden="true" />
                <span className="inline-block text-[11px] font-bold uppercase tracking-wide text-amber-700 bg-amber-100 rounded-full px-2 py-0.5 mb-1">
                  🔒 Vorabzugang
                </span>
                <h2 className="text-lg font-semibold text-amber-950">{event.title}</h2>
                <p className="text-sm text-amber-700 mt-2 font-medium">Nur mit Passwort sichtbar</p>
              </Link>
            );
          }

          if (event.comingSoon) {
            return (
              <Link
                key={event.id}
                to={`/veranstaltung/${event.slug}`}
                className="block bg-stone-50 border-2 border-dashed border-stone-300 rounded-xl p-5 opacity-90 hover:opacity-100 hover:border-stone-400 hover:shadow-sm transition-all"
              >
                <h2 className="text-lg font-semibold text-stone-700">{event.title}</h2>
                <p className="text-sm text-stone-500 mt-2 font-semibold">
                  ⏳ Coming Soon — jetzt schon Interesse bekunden
                </p>
              </Link>
            );
          }

          const activeBuses = event.buses.filter((b) => b.enabled);
          const totalCapacity = activeBuses.reduce((sum, b) => sum + b.capacity, 0);
          const totalRemaining = activeBuses.reduce((sum, b) => sum + b.remaining, 0);
          const soldOut = totalRemaining === 0;
          const closed = !event.registrationOpen || soldOut;

          return (
            <Link
              key={event.id}
              to={`/veranstaltung/${event.slug}`}
              className={`relative block rounded-xl pl-6 pr-5 py-5 shadow-md hover:shadow-xl hover:-translate-y-0.5 transition-all overflow-hidden border-2 ${
                closed
                  ? "bg-gradient-to-br from-red-50 to-white border-red-300 hover:border-red-500"
                  : "bg-gradient-to-br from-teal-50 to-white border-teal-300 hover:border-teal-500"
              }`}
            >
              <span
                className={`absolute left-0 top-0 bottom-0 w-1.5 ${closed ? "bg-red-500" : "bg-teal-600"}`}
                aria-hidden="true"
              />
              <span
                className={`inline-block text-[11px] font-bold uppercase tracking-wide rounded-full px-2 py-0.5 mb-1 ${
                  closed ? "text-red-700 bg-red-100" : "text-teal-700 bg-teal-100"
                }`}
              >
                {!event.registrationOpen ? "⛔ Anmeldung geschlossen" : soldOut ? "🔴 Ausgebucht" : "🎉 Jetzt anmelden"}
              </span>
              <h2 className={`text-lg font-semibold ${closed ? "text-red-950" : "text-teal-950"}`}>{event.title}</h2>
              <p className="text-sm text-gray-500 mt-1">
                {new Date(event.eventDate).toLocaleDateString("de-DE", {
                  weekday: "long",
                  day: "2-digit",
                  month: "2-digit",
                  year: "numeric",
                })}
              </p>
              {!event.registrationOpen && (
                <p className="text-sm mt-2 font-semibold text-red-600">Anmeldefrist abgelaufen</p>
              )}
              {totalCapacity > 0 && (
                <p className={`text-sm mt-1 font-medium ${soldOut ? "text-red-600" : "text-gray-600"}`}>
                  {totalRemaining} von {totalCapacity} Plätzen frei
                </p>
              )}
            </Link>
          );
        })}
      </div>

      <NewsletterSignup />
      <ContactForm />
    </div>
  );
}
