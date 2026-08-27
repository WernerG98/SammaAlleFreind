import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../lib/api.js";
import ContactForm from "../components/ContactForm.jsx";

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
      <h1 className="text-2xl font-bold mb-2">Kommende Veranstaltungen</h1>
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
              <div
                key={event.id}
                className="bg-white/90 border border-dashed rounded-lg p-5"
              >
                <h2 className="text-lg font-semibold">{event.title}</h2>
                <p className="text-sm text-gray-500 mt-2 font-medium">Coming Soon</p>
              </div>
            );
          }

          const totalRemaining = event.buses.reduce((sum, b) => sum + b.remaining, 0);
          return (
            <Link
              key={event.id}
              to={`/veranstaltung/${event.slug}`}
              className="block bg-white border rounded-lg p-5 hover:shadow-md transition-shadow"
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
              <p className="text-sm text-gray-600 mt-2">
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

      <ContactForm />
    </div>
  );
}
