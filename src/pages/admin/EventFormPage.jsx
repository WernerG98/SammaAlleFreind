import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { api } from "../../lib/api.js";
import RichTextEditor from "../../components/RichTextEditor.jsx";
import Skeleton from "../../components/Skeleton.jsx";

const emptyBus = () => ({ name: "", capacity: "", enabled: true });

function toDateInputValue(date) {
  return new Date(date).toISOString().slice(0, 10);
}

function toDateTimeInputValue(date) {
  const d = new Date(date);
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

const inputClass =
  "w-full border border-gray-700 bg-gray-800 text-gray-100 placeholder-gray-500 rounded px-3 py-2 focus:outline-none focus:border-teal-500";

function Section({ title, children }) {
  return (
    <div className="space-y-4 pt-6 border-t border-gray-800 first:pt-0 first:border-t-0">
      <h2 className="text-xs font-semibold uppercase tracking-wider text-teal-500">{title}</h2>
      <div className="space-y-4">{children}</div>
    </div>
  );
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
    iban: "",
    bic: "",
    accountHolder: "",
    noRegistrationRequired: false,
    commentsEnabled: false,
    earlyAccessEnabled: false,
    earlyAccessPassword: "",
    isPrivate: false,
    privatePassword: "",
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
          noRegistrationRequired: event.noRegistrationRequired || false,
          commentsEnabled: event.commentsEnabled || false,
          eventDate: event.eventDate ? toDateTimeInputValue(event.eventDate) : "",
          registrationDeadline: event.registrationDeadline ? toDateInputValue(event.registrationDeadline) : "",
          pricePerPerson: event.pricePerPerson || "",
          paypalLink: event.paypalLink || "",
          paymentNote: event.paymentNote || "",
          iban: event.iban || "",
          bic: event.bic || "",
          accountHolder: event.accountHolder || "",
          earlyAccessEnabled: event.earlyAccessEnabled || false,
          earlyAccessPassword: event.earlyAccessPassword || "",
          isPrivate: event.isPrivate || false,
          privatePassword: event.privatePassword || "",
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
      const payload = {
        ...form,
        eventDate: form.eventDate ? new Date(form.eventDate).toISOString() : "",
        buses: form.comingSoon || form.noRegistrationRequired ? [] : buses,
      };
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

  if (loading) {
    return (
      <div className="max-w-2xl">
        <Skeleton className="h-8 w-56 mb-6" />
        <Skeleton className="h-96 w-full rounded-lg" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold mb-6 text-gray-100">
        {isNew ? "Neue Veranstaltung" : "Veranstaltung bearbeiten"}
      </h1>

      <form onSubmit={handleSubmit} className="space-y-0 bg-gray-900 border border-gray-800 rounded-lg p-6">
        <Section title="Grunddaten">
          <div>
            <label className="block text-sm font-medium mb-1 text-gray-300">Titel</label>
            <input
              required
              className={inputClass}
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1 text-gray-300">Beschreibung</label>
            <RichTextEditor
              key={id || "new"}
              value={form.description}
              onChange={(html) => setForm({ ...form, description: html })}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1 text-gray-300">Flyer-Bild (optional)</label>
            {form.imageUrl && (
              <img
                src={form.imageUrl}
                alt="Flyer-Vorschau"
                className="w-full max-h-64 object-contain rounded-lg border border-gray-700 mb-2 bg-gray-800"
              />
            )}
            <input
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              className="block w-full text-sm text-gray-300 border border-gray-700 bg-gray-800 rounded px-3 py-2"
            />
            {imageError && <p className="text-xs text-red-400 mt-1">{imageError}</p>}
            {form.imageUrl && (
              <button
                type="button"
                onClick={() => setForm({ ...form, imageUrl: "" })}
                className="text-xs text-red-400 hover:underline mt-1"
              >
                Bild entfernen
              </button>
            )}
            <p className="text-xs text-gray-500 mt-1">
              Wird oben auf der Veranstaltungsseite als Flyer angezeigt (max. 3 MB).
            </p>
          </div>
        </Section>

        <Section title="Art der Veranstaltung">
          <label className="flex items-center gap-2 text-sm text-gray-300">
            <input
              type="checkbox"
              checked={form.comingSoon}
              onChange={(e) => setForm({ ...form, comingSoon: e.target.checked })}
            />
            Nur Ankündigung ("Coming Soon"), Datum, Preis und Slots stehen noch nicht fest
          </label>

          {form.comingSoon && (
            <div>
              <label className="block text-sm font-medium mb-1 text-gray-300">Datum &amp; Startzeit (optional)</label>
              <input
                type="datetime-local"
                className={inputClass}
                value={form.eventDate}
                onChange={(e) => setForm({ ...form, eventDate: e.target.value })}
              />
              <p className="text-xs text-gray-500 mt-1">
                Falls schon bekannt, wird das Datum auf der Kachel angezeigt, auch wenn die Anmeldung noch nicht
                möglich ist.
              </p>
            </div>
          )}

          {role === "external" ? (
            <div className="border border-gray-700 rounded-lg p-3 space-y-2 bg-gray-800">
              <p className="text-xs text-gray-400">
                Diese Veranstaltung wird automatisch als "Externe Veranstaltung" markiert.
              </p>
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-300">Verein/Ansprechperson</label>
                <input
                  required
                  placeholder="z.B. Name des Vereins"
                  className={`${inputClass} text-sm`}
                  value={form.externalOrganizer}
                  onChange={(e) => setForm({ ...form, externalOrganizer: e.target.value })}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Wird zusammen mit der Kontakt-E-Mail auf der Kachel und der Veranstaltungsseite angezeigt.
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-300">Kontakt-E-Mail</label>
                <input
                  required
                  type="email"
                  placeholder="kontakt@euer-verein.de"
                  className={`${inputClass} text-sm`}
                  value={form.externalContactEmail}
                  onChange={(e) => setForm({ ...form, externalContactEmail: e.target.value })}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Wird bei der Veranstaltung angezeigt, damit Interessierte euch direkt kontaktieren können.
                </p>
              </div>
            </div>
          ) : (
            <div className="border border-gray-700 rounded-lg p-3 space-y-2">
              <label className="flex items-center gap-2 text-sm font-medium text-gray-300">
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
                    required
                    placeholder="Verein/Ansprechperson (z.B. Name des Vereins)"
                    className={`${inputClass} text-sm`}
                    value={form.externalOrganizer}
                    onChange={(e) => setForm({ ...form, externalOrganizer: e.target.value })}
                  />
                  <div>
                    <input
                      required
                      type="email"
                      placeholder="Kontakt-E-Mail (kontakt@verein.de)"
                      className={`${inputClass} text-sm`}
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
        </Section>

        {!form.comingSoon && (
          <>
            <Section title="Termin & Teilnahme">
              <label className="flex items-center gap-2 text-sm text-gray-300">
                <input
                  type="checkbox"
                  checked={form.noRegistrationRequired}
                  onChange={(e) => setForm({ ...form, noRegistrationRequired: e.target.checked })}
                />
                🎉 Öffentliche Veranstaltung, keine Anmeldung nötig
              </label>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1 text-gray-300">Datum &amp; Startzeit</label>
                  <input
                    required
                    type="datetime-local"
                    className={inputClass}
                    value={form.eventDate}
                    onChange={(e) => setForm({ ...form, eventDate: e.target.value })}
                  />
                </div>
                {!form.noRegistrationRequired && (
                  <div>
                    <label className="block text-sm font-medium mb-1 text-gray-300">Preis pro Person (€)</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      className={inputClass}
                      value={form.pricePerPerson}
                      onChange={(e) => setForm({ ...form, pricePerPerson: e.target.value })}
                    />
                  </div>
                )}
              </div>
            </Section>

            {!form.noRegistrationRequired && (
              <>
                <Section title="Anmeldung">
                  <div>
                    <label className="block text-sm font-medium mb-1 text-gray-300">Anmeldeschluss (optional)</label>
                    <input
                      type="date"
                      className={inputClass}
                      value={form.registrationDeadline}
                      onChange={(e) => setForm({ ...form, registrationDeadline: e.target.value })}
                    />
                    <p className="text-xs text-gray-500 mt-1">Nach diesem Datum ist keine Anmeldung mehr möglich.</p>
                  </div>

                  <label className="flex items-center gap-2 text-sm text-gray-300">
                    <input
                      type="checkbox"
                      checked={form.commentsEnabled}
                      onChange={(e) => setForm({ ...form, commentsEnabled: e.target.checked })}
                    />
                    💬 Kommentare zulassen, Teilnehmer können bei der Anmeldung eine Nachricht hinterlassen
                  </label>
                </Section>

                <Section title="Zahlung">
                  <div>
                    <label className="block text-sm font-medium mb-1 text-gray-300">
                      PayPal.me-Link der Privatperson (optional, kann später ergänzt werden)
                    </label>
                    <input
                      placeholder="https://paypal.me/deinname"
                      className={inputClass}
                      value={form.paypalLink}
                      onChange={(e) => setForm({ ...form, paypalLink: e.target.value })}
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Solange weder PayPal-Link noch Überweisungsdaten hinterlegt sind, steht auf der
                      Zahlungsseite "Zahlungsinfos folgen bald".
                    </p>
                  </div>

                  <div className="border border-gray-700 rounded-lg p-3 space-y-3 bg-gray-800">
                    <p className="text-sm font-medium text-gray-300">
                      Überweisung (optional, zusätzlich oder statt PayPal)
                    </p>
                    <div>
                      <label className="block text-xs text-gray-400 mb-1">Kontoinhaber</label>
                      <input
                        placeholder="Vorname Nachname"
                        className={`${inputClass} text-sm`}
                        value={form.accountHolder}
                        onChange={(e) => setForm({ ...form, accountHolder: e.target.value })}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs text-gray-400 mb-1">IBAN</label>
                        <input
                          placeholder="DE12 3456 7890 1234 5678 90"
                          className={`${inputClass} text-sm`}
                          value={form.iban}
                          onChange={(e) => setForm({ ...form, iban: e.target.value })}
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-400 mb-1">BIC</label>
                        <input
                          placeholder="XXXXDEXXXXX"
                          className={`${inputClass} text-sm`}
                          value={form.bic}
                          onChange={(e) => setForm({ ...form, bic: e.target.value })}
                        />
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1 text-gray-300">
                      Hinweis zum Verwendungszweck (optional, <code>{"{name}"}</code> wird ersetzt)
                    </label>
                    <input
                      className={inputClass}
                      placeholder="{name}"
                      value={form.paymentNote}
                      onChange={(e) => setForm({ ...form, paymentNote: e.target.value })}
                    />
                  </div>
                </Section>

                <Section title="Zugriffsbeschränkung">
                  <div className="border border-gray-700 rounded-lg p-3 space-y-2 bg-gray-800">
                    <label className="flex items-center gap-2 text-sm font-medium text-gray-300">
                      <input
                        type="checkbox"
                        checked={form.earlyAccessEnabled}
                        onChange={(e) => setForm({ ...form, earlyAccessEnabled: e.target.checked })}
                      />
                      🔒 Vorabzugang, nur mit Passwort anmeldbar
                    </label>
                    {form.earlyAccessEnabled && (
                      <div>
                        <input
                          required
                          placeholder="Passwort für den Vorabzugang"
                          className={`${inputClass} text-sm`}
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

                  <div className="border border-gray-700 rounded-lg p-3 space-y-2 bg-gray-800">
                    <label className="flex items-center gap-2 text-sm font-medium text-gray-300">
                      <input
                        type="checkbox"
                        checked={form.isPrivate}
                        onChange={(e) => setForm({ ...form, isPrivate: e.target.checked })}
                      />
                      🔒 Privat, nur mit Passwort anmeldbar
                    </label>
                    {form.isPrivate && (
                      <div>
                        <input
                          required
                          placeholder="Passwort für den privaten Zugang"
                          className={`${inputClass} text-sm`}
                          value={form.privatePassword}
                          onChange={(e) => setForm({ ...form, privatePassword: e.target.value })}
                        />
                        <p className="text-xs text-gray-500 mt-1">
                          Auf der Startseite wird "🔒 Privat" angezeigt, Details/Anmeldung nur mit diesem
                          Passwort sichtbar. Haken entfernen, sobald es für alle offen sein soll.
                        </p>
                      </div>
                    )}
                  </div>
                </Section>

                <Section title="Slots">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="block text-sm font-medium text-gray-300">Slots</label>
                      <button
                        type="button"
                        onClick={() => setBuses([...buses, emptyBus()])}
                        className="text-sm text-teal-400 hover:underline"
                      >
                        + Slot hinzufügen
                      </button>
                    </div>
                    <div className="space-y-2">
                      {buses.map((bus, i) => (
                        <div
                          key={bus.id || i}
                          className="flex flex-wrap items-center gap-2 border border-gray-700 rounded-lg p-2 sm:border-0 sm:p-0"
                        >
                          <input
                            required
                            placeholder="Name (z.B. Slot 1)"
                            className={`flex-1 min-w-[140px] ${inputClass}`}
                            value={bus.name}
                            onChange={(e) => updateBus(i, "name", e.target.value)}
                          />
                          <input
                            type="number"
                            min="1"
                            placeholder="Plätze (optional)"
                            className={`w-32 ${inputClass}`}
                            value={bus.capacity}
                            onChange={(e) => updateBus(i, "capacity", e.target.value)}
                          />
                          <label className="flex items-center gap-1 text-xs text-gray-400 whitespace-nowrap">
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
                              className="text-red-400 px-2"
                            >
                              ✕
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      Plätze sind optional, ohne Angabe ist der Slot unbegrenzt buchbar.
                    </p>
                  </div>
                </Section>
              </>
            )}
          </>
        )}

        {!isNew && (
          <Section title="Sichtbarkeit">
            <label className="flex items-center gap-2 text-sm text-gray-300">
              <input
                type="checkbox"
                checked={form.isOpen}
                onChange={(e) => setForm({ ...form, isOpen: e.target.checked })}
              />
              Veranstaltung ist öffentlich sichtbar
            </label>
          </Section>
        )}

        <div className="pt-6 border-t border-gray-800 space-y-4">
          {error && <p className="text-sm text-red-400">{error}</p>}

          <button
            type="submit"
            disabled={submitting}
            className="bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-400 hover:to-emerald-400 text-white rounded px-4 py-2 font-medium shadow-sm shadow-teal-950/30 disabled:opacity-50 active:scale-[0.98] transition-all"
          >
            {submitting ? "Speichern…" : "Speichern"}
          </button>
        </div>
      </form>
    </div>
  );
}
