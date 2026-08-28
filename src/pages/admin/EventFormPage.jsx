import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { api } from "../../lib/api.js";

const emptyBus = () => ({ name: "", capacity: "" });

function toDateInputValue(date) {
  return new Date(date).toISOString().slice(0, 10);
}

export default function EventFormPage() {
  const { id } = useParams();
  const isNew = id === undefined;
  const navigate = useNavigate();

  const [form, setForm] = useState({
    title: "",
    description: "",
    imageUrl: "",
    comingSoon: false,
    eventDate: "",
    registrationDeadline: "",
    pricePerPerson: "",
    paypalLink: "",
    paymentNote: "",
    isOpen: true,
  });
  const [buses, setBuses] = useState([emptyBus()]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(!isNew);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (isNew) return;
    api
      .get(`/admin/events/${id}`)
      .then((event) => {
        setForm({
          title: event.title,
          description: event.description || "",
          imageUrl: event.imageUrl || "",
          comingSoon: event.comingSoon,
          eventDate: event.eventDate ? toDateInputValue(event.eventDate) : "",
          registrationDeadline: event.registrationDeadline ? toDateInputValue(event.registrationDeadline) : "",
          pricePerPerson: event.pricePerPerson || "",
          paypalLink: event.paypalLink || "",
          paymentNote: event.paymentNote || "",
          isOpen: event.isOpen,
        });
        setBuses(event.buses.length ? event.buses : [emptyBus()]);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [id, isNew]);

  function updateBus(index, field, value) {
    setBuses((prev) => prev.map((b, i) => (i === index ? { ...b, [field]: value } : b)));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      const payload = { ...form, buses: form.comingSoon ? [] : buses };
      if (isNew) {
        const event = await api.post("/admin/events", payload);
        navigate(`/admin/veranstaltungen/${event.id}`);
      } else {
        await api.put(`/admin/events/${id}`, payload);
        navigate("/admin");
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) return <p className="text-gray-500">Lade...</p>;

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold mb-6">{isNew ? "Neue Veranstaltung" : "Veranstaltung bearbeiten"}</h1>

      <form onSubmit={handleSubmit} className="space-y-6 bg-white border rounded-lg p-6">
        <div>
          <label className="block text-sm font-medium mb-1">Titel</label>
          <input
            required
            className="w-full border rounded px-3 py-2"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Beschreibung</label>
          <textarea
            rows={4}
            className="w-full border rounded px-3 py-2"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Flyer-Bild-URL (optional)</label>
          <input
            placeholder="/background.png"
            className="w-full border rounded px-3 py-2"
            value={form.imageUrl}
            onChange={(e) => setForm({ ...form, imageUrl: e.target.value })}
          />
          <p className="text-xs text-gray-500 mt-1">Wird oben auf der Veranstaltungsseite als Flyer angezeigt.</p>
        </div>

        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={form.comingSoon}
            onChange={(e) => setForm({ ...form, comingSoon: e.target.checked })}
          />
          Nur Ankündigung ("Coming Soon") — Datum, Preis und Busse stehen noch nicht fest
        </label>

        {!form.comingSoon && (
          <>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Datum</label>
                <input
                  required
                  type="date"
                  className="w-full border rounded px-3 py-2"
                  value={form.eventDate}
                  onChange={(e) => setForm({ ...form, eventDate: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Preis pro Person (€)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  className="w-full border rounded px-3 py-2"
                  value={form.pricePerPerson}
                  onChange={(e) => setForm({ ...form, pricePerPerson: e.target.value })}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Anmeldeschluss (optional)</label>
              <input
                type="date"
                className="w-full border rounded px-3 py-2"
                value={form.registrationDeadline}
                onChange={(e) => setForm({ ...form, registrationDeadline: e.target.value })}
              />
              <p className="text-xs text-gray-500 mt-1">Nach diesem Datum ist keine Anmeldung mehr möglich.</p>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                PayPal.me-Link der Privatperson (optional, kann später ergänzt werden)
              </label>
              <input
                placeholder="https://paypal.me/deinname"
                className="w-full border rounded px-3 py-2"
                value={form.paypalLink}
                onChange={(e) => setForm({ ...form, paypalLink: e.target.value })}
              />
              <p className="text-xs text-gray-500 mt-1">
                Solange kein Link hinterlegt ist, steht auf der Zahlungsseite "Link folgt bald".
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                Hinweis zum Verwendungszweck (optional, <code>{"{name}"}</code> wird ersetzt)
              </label>
              <input
                className="w-full border rounded px-3 py-2"
                placeholder="{name}"
                value={form.paymentNote}
                onChange={(e) => setForm({ ...form, paymentNote: e.target.value })}
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium">Busse</label>
                <button
                  type="button"
                  onClick={() => setBuses([...buses, emptyBus()])}
                  className="text-sm text-blue-600 hover:underline"
                >
                  + Bus hinzufügen
                </button>
              </div>
              <div className="space-y-2">
                {buses.map((bus, i) => (
                  <div key={bus.id || i} className="flex gap-2">
                    <input
                      required
                      placeholder="Name (z.B. Bus 1)"
                      className="flex-1 border rounded px-3 py-2"
                      value={bus.name}
                      onChange={(e) => updateBus(i, "name", e.target.value)}
                    />
                    <input
                      required
                      type="number"
                      min="1"
                      placeholder="Plätze"
                      className="w-28 border rounded px-3 py-2"
                      value={bus.capacity}
                      onChange={(e) => updateBus(i, "capacity", e.target.value)}
                    />
                    {buses.length > 1 && (
                      <button
                        type="button"
                        onClick={() => setBuses(buses.filter((_, idx) => idx !== i))}
                        className="text-red-600 px-2"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {!isNew && (
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={form.isOpen}
              onChange={(e) => setForm({ ...form, isOpen: e.target.checked })}
            />
            Veranstaltung ist öffentlich sichtbar und offen für Anmeldungen
          </label>
        )}

        {error && <p className="text-sm text-red-600">{error}</p>}

        <button
          type="submit"
          disabled={submitting}
          className="bg-gray-900 text-white rounded px-4 py-2 font-medium disabled:opacity-50"
        >
          {submitting ? "Speichern…" : "Speichern"}
        </button>
      </form>
    </div>
  );
}
