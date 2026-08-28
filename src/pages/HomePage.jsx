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

          const totalRemaining = event.buses
            .filter((b) => b.enabled)
            .reduce((sum, b) => sum + b.remaining, 0);
          return (
            <Link
              key={event.id}
              to={`/veranstaltung/${event.slug}`}
              className="relative block bg-gradient-to-br from-teal-50 to-white border-2 border-teal-300 rounded-xl pl-6 pr-5 py-5 shadow-md hover:shadow-xl hover:border-teal-500 hover:-translate-y-0.5 transition-all overflow-hidden"
            >
              <span className="absolute left-0 top-0 bottom-0 w-1.5 bg-teal-600" aria-hidden="true" />
              <span className="inline-block text-[11px] font-bold uppercase tracking-wide text-teal-700 bg-teal-100 rounded-full px-2 py-0.5 mb-1">
                🎉 Jetzt anmelden
              </span>
              <h2 className="text-lg font-semibold text-teal-950">{event.title}</h2>
              <p className="text-sm text-gray-500 mt-1">
                {new Date(event.eventDate).toLocaleDateString("de-DE", {
                  weekday: "long",
                  day: "2-digit",
                  month: "2-digit",
                  year: "numeric",
                })}
              </p>
              <p
                className={`text-sm mt-2 font-semibold ${
                  !event.registrationOpen
                    ? "text-gray-500"
                    : totalRemaining > 0
                      ? "text-emerald-700"
                      : "text-red-600"
                }`}
              >
                {!event.registrationOpen
                  ? "Anmeldefrist abgelaufen"
                  : totalRemaining > 0
                    ? `Noch ${totalRemaining} Plätze frei`
                    : "Ausgebucht"}
              </p>
            </Link>
          );
        })}
      </div>

      <NewsletterSignup />
      <ContactForm />
    </div>
  );
}
