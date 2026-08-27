import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { api } from "../lib/api.js";

export default function EventPage() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [event, setEvent] = useState(null);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    busId: "",
    newsletterOptIn: false,
  });

  useEffect(() => {
    api
      .get(`/events/${slug}`)
      .then(setEvent)
      .catch((err) => setError(err.message));
  }, [slug]);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      const { id } = await api.post("/register", { eventId: event.id, ...form });
      navigate(`/anmeldung/${id}/zahlung`);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  if (error && !event) {
    return <p className="max-w-lg mx-auto px-4 py-12 text-red-600">{error}</p>;
  }
  if (!event) {
    return <p className="max-w-lg mx-auto px-4 py-12 text-gray-500">Lade...</p>;
  }
  if (event.comingSoon) {
    return (
      <div className="max-w-lg mx-auto px-4 py-12">
        <h1 className="text-2xl font-bold">{event.title}</h1>
        <p className="mt-4 text-gray-600 font-medium">Coming Soon — Details folgen in Kürze.</p>
      </div>
    );
  }

  const availableBuses = event.buses.filter((b) => b.remaining > 0);
  const deadlinePassed = !event.registrationOpen;

  return (
    <div className="max-w-lg mx-auto px-4 py-12">
      <h1 className="text-2xl font-bold">{event.title}</h1>
      <p className="text-sm text-gray-500 mt-1">
        {new Date(event.eventDate).toLocaleDateString("de-DE", {
          weekday: "long",
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
        })}
      </p>
      {event.registrationDeadline && !deadlinePassed && (
        <p className="text-sm text-gray-500">
          Anmeldeschluss:{" "}
          {new Date(event.registrationDeadline).toLocaleDateString("de-DE", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
          })}
        </p>
      )}
      {event.description && <p className="mt-4 text-gray-700 whitespace-pre-line">{event.description}</p>}

      {deadlinePassed ? (
        <div className="mt-8 bg-white border rounded-lg p-6">
          <p className="text-red-600 font-medium">Die Anmeldefrist für diese Veranstaltung ist abgelaufen.</p>
        </div>
      ) : (
      <form onSubmit={handleSubmit} className="mt-8 space-y-4 bg-white border rounded-lg p-6">
        <h2 className="font-semibold">Anmeldung</h2>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Vorname</label>
            <input
              required
              className="w-full border rounded px-3 py-2"
              value={form.firstName}
              onChange={(e) => setForm({ ...form, firstName: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Name</label>
            <input
              required
              className="w-full border rounded px-3 py-2"
              value={form.lastName}
              onChange={(e) => setForm({ ...form, lastName: e.target.value })}
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">E-Mail-Adresse</label>
          <input
            required
            type="email"
            className="w-full border rounded px-3 py-2"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Bus</label>
          {availableBuses.length === 0 ? (
            <p className="text-sm text-red-600">Alle Busse sind ausgebucht.</p>
          ) : (
            <select
              required
              className="w-full border rounded px-3 py-2"
              value={form.busId}
              onChange={(e) => setForm({ ...form, busId: e.target.value })}
            >
              <option value="" disabled>
                Bitte wählen…
              </option>
              {event.buses.map((bus) => (
                <option key={bus.id} value={bus.id} disabled={bus.remaining === 0}>
                  {bus.name} — {bus.remaining > 0 ? `noch ${bus.remaining} Plätze frei` : "ausgebucht"}
                </option>
              ))}
            </select>
          )}
        </div>

        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={form.newsletterOptIn}
            onChange={(e) => setForm({ ...form, newsletterOptIn: e.target.checked })}
          />
          Ich möchte den Newsletter zu zukünftigen Veranstaltungen erhalten.
        </label>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <button
          type="submit"
          disabled={submitting || availableBuses.length === 0}
          className="w-full bg-gray-900 text-white rounded py-2 font-medium disabled:opacity-50"
        >
          {submitting ? "Wird gesendet…" : "Verbindlich anmelden"}
        </button>
      </form>
      )}
    </div>
  );
}
