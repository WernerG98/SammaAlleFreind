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
        Die Bezahlung erfolgt per PayPal. Für andere Zahlungsmethoden melde dich bitte über das Kontaktformular
        weiter unten.
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
                className="block bg-white border-2 border-dashed border-teal-200 rounded-xl p-5 hover:border-teal-500 hover:shadow-md transition-all"
              >
                <h2 className="text-lg font-semibold">{event.title}</h2>
                <p className="text-sm text-teal-700 mt-2 font-semibold">
                  ✨ Coming Soon — jetzt schon Interesse bekunden
                </p>
              </Link>
            );
          }

          const totalRemaining = event.buses.reduce((sum, b) => sum + b.remaining, 0);
          return (
            <Link
              key={event.id}
              to={`/veranstaltung/${event.slug}`}
              className="block bg-white border rounded-xl p-5 hover:shadow-lg hover:-translate-y-0.5 transition-all"
            >
              <h2 className="text-lg font-semibold">{event.title}</h2>
              <p className="text-sm text-gray-500 mt-1">
                {new Date(event.eventDate).toLocaleDateString("de-DE", {
                  weekday: "long",
                  day: "2-digit",
                  month: "2-digit",
                  year: "numeric",
                })}
              </p>
              <p
                className={`text-sm mt-2 font-medium ${
                  !event.registrationOpen
                    ? "text-gray-500"
                    : totalRemaining > 0
                      ? "text-emerald-600"
                      : "text-red-500"
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
