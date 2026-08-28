import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { api } from "../../lib/api.js";
import RichTextEditor from "../../components/RichTextEditor.jsx";

const emptyBus = () => ({ name: "", capacity: "", enabled: true });

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
    earlyAccessEnabled: false,
    earlyAccessPassword: "",
    isExternal: false,
    externalOrganizer: "",
    externalContactEmail: "",
    isOpen: true,
  });
  const [buses, setBuses] = useState([emptyBus()]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(!isNew);
  const [submitting, setSubmitting] = useState(false);
  const [role, setRole] = useState("admin");

  useEffect(() => {
    api
      .get("/admin/session")
      .then((s) => setRole(s.role || "admin"))
      .catch(() => {});
  }, []);
  const [imageError, setImageError] = useState("");

  function handleImageUpload(e) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    setImageError("");
    if (file.size > 3 * 1024 * 1024) {
      setImageError("Bild ist zu groß (max. 3 MB).");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => setForm((f) => ({ ...f, imageUrl: reader.result }));
    reader.onerror = () => setImageError("Bild konnte nicht gelesen werden.");
    reader.readAsDataURL(file);
  }

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
          earlyAccessEnabled: event.earlyAccessEnabled || false,
          earlyAccessPassword: event.earlyAccessPassword || "",
          isExternal: event.isExternal || false,
          externalOrganizer: event.externalOrganizer || "",
          externalContactEmail: event.externalContactEmail || "",
          isOpen: event.isOpen,
        });
        setBuses(
          event.buses.length
            ? event.buses.map((bus) => ({ ...bus, capacity: bus.capacity ?? "" }))
            : [emptyBus()]
        );
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
        await api.post("/admin/events", payload);
        navigate("/admin");
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
          <RichTextEditor
            key={id || "new"}
            value={form.description}
            onChange={(html) => setForm({ ...form, description: html })}
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Flyer-Bild (optional)</label>
          {form.imageUrl && (
            <img
              src={form.imageUrl}
              alt="Flyer-Vorschau"
              className="w-full max-h-64 object-contain rounded-lg border mb-2 bg-gray-50"
            />
          )}
          <input
            type="file"
            accept="image/*"
            onChange={handleImageUpload}
            className="block w-full text-sm border rounded px-3 py-2"
          />
          {imageError && <p className="text-xs text-red-600 mt-1">{imageError}</p>}
          {form.imageUrl && (
            <button
              type="button"
              onClick={() => setForm({ ...form, imageUrl: "" })}
              className="text-xs text-red-600 hover:underline mt-1"
            >
              Bild entfernen
            </button>
          )}
          <p className="text-xs text-gray-500 mt-1">
            Wird oben auf der Veranstaltungsseite als Flyer angezeigt (max. 3 MB).
          </p>
        </div>

        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={form.comingSoon}
            onChange={(e) => setForm({ ...form, comingSoon: e.target.checked })}
          />
          Nur Ankündigung ("Coming Soon") — Datum, Preis und Busse stehen noch nicht fest
        </label>

        {role === "external" ? (
          <div className="border rounded-lg p-3 space-y-2 bg-gray-50">
            <p className="text-xs text-gray-500">
              Diese Veranstaltung wird automatisch als "Externe Veranstaltung" markiert.
            </p>
            <div>
              <label className="block text-sm font-medium mb-1">Verein/Ansprechperson</label>
              <input
                required
                placeholder="z.B. Name des Vereins"
                className="w-full border rounded px-3 py-2 text-sm"
                value={form.externalOrganizer}
                onChange={(e) => setForm({ ...form, externalOrganizer: e.target.value })}
              />
              <p className="text-xs text-gray-500 mt-1">
                Wird zusammen mit der Kontakt-E-Mail auf der Kachel und der Veranstaltungsseite angezeigt.
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Kontakt-E-Mail</label>
              <input
                required
                type="email"
                placeholder="kontakt@euer-verein.de"
                className="w-full border rounded px-3 py-2 text-sm"
                value={form.externalContactEmail}
                onChange={(e) => setForm({ ...form, externalContactEmail: e.target.value })}
              />
              <p className="text-xs text-gray-500 mt-1">
                Wird bei der Veranstaltung angezeigt, damit Interessierte euch direkt kontaktieren können.
              </p>
            </div>
          </div>
        ) : (
          <div className="border rounded-lg p-3 space-y-2">
            <label className="flex items-center gap-2 text-sm font-medium">
              <input
                type="checkbox"
                checked={form.isExternal}
                onChange={(e) => setForm({ ...form, isExternal: e.target.checked })}
              />
              🤝 Externe Veranstaltung (anderer Verein/Person)
            </label>
            {form.isExternal && (
              <>
                <input
                  placeholder="Veranstalter (z.B. Name des Vereins)"
                  className="w-full border rounded px-3 py-2 text-sm"
                  value={form.externalOrganizer}
                  onChange={(e) => setForm({ ...form, externalOrganizer: e.target.value })}
                />
                <div>
                  <input
                    required
                    type="email"
                    placeholder="Kontakt-E-Mail (kontakt@verein.de)"
                    className="w-full border rounded px-3 py-2 text-sm"
                    value={form.externalContactEmail}
                    onChange={(e) => setForm({ ...form, externalContactEmail: e.target.value })}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Wird bei der Veranstaltung angezeigt, damit Interessierte direkt Kontakt aufnehmen können.
                  </p>
                </div>
              </>
            )}
          </div>
        )}

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

            <div className="border rounded-lg p-3 space-y-2 bg-gray-50">
              <label className="flex items-center gap-2 text-sm font-medium">
                <input
                  type="checkbox"
                  checked={form.earlyAccessEnabled}
                  onChange={(e) => setForm({ ...form, earlyAccessEnabled: e.target.checked })}
                />
                🔒 Vorabzugang — nur mit Passwort anmeldbar
              </label>
              {form.earlyAccessEnabled && (
                <div>
                  <input
                    required
                    placeholder="Passwort für den Vorabzugang"
                    className="w-full border rounded px-3 py-2 text-sm"
                    value={form.earlyAccessPassword}
                    onChange={(e) => setForm({ ...form, earlyAccessPassword: e.target.value })}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Auf der Startseite wird "🔒 Vorabzugang" angezeigt, Details/Anmeldung nur mit diesem
                    Passwort sichtbar. Haken entfernen, sobald es für alle offen sein soll.
                  </p>
                </div>
              )}
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium">Busse</label>
                <button
                  type="button"
                  onClick={() => setBuses([...buses, emptyBus()])}
                  className="text-sm text-blue-600 hover:underline"
                >
                  + Slot hinzufügen
                </button>
              </div>
              <div className="space-y-2">
                {buses.map((bus, i) => (
                  <div
                    key={bus.id || i}
                    className="flex flex-wrap items-center gap-2 border rounded-lg p-2 sm:border-0 sm:p-0"
                  >
                    <input
                      required
                      placeholder="Name (z.B. Bus 1)"
                      className="flex-1 min-w-[140px] border rounded px-3 py-2"
                      value={bus.name}
                      onChange={(e) => updateBus(i, "name", e.target.value)}
                    />
                    <input
                      type="number"
                      min="1"
                      placeholder="Plätze (optional)"
                      className="w-32 border rounded px-3 py-2"
                      value={bus.capacity}
                      onChange={(e) => updateBus(i, "capacity", e.target.value)}
                    />
                    <label className="flex items-center gap-1 text-xs text-gray-600 whitespace-nowrap">
                      <input
                        type="checkbox"
                        checked={bus.enabled !== false}
                        onChange={(e) => updateBus(i, "enabled", e.target.checked)}
                      />
                      buchbar
                    </label>
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
              <p className="text-xs text-gray-500 mt-1">
                Plätze sind optional — ohne Angabe ist der Slot unbegrenzt buchbar.
              </p>
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
