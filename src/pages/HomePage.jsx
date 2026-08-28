import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../lib/api.js";
import ContactForm from "../components/ContactForm.jsx";
import NewsletterSignup from "../components/NewsletterSignup.jsx";

function getEventMeta(event) {
  if (event.locked) return { status: "locked" };
  if (event.comingSoon) return { status: "comingSoon" };

  const activeBuses = event.buses.filter((b) => b.enabled);
  const hasUnlimitedBus = activeBuses.some((b) => b.capacity === null);
  const totalCapacity = hasUnlimitedBus ? null : activeBuses.reduce((sum, b) => sum + b.capacity, 0);
  const totalRemaining = hasUnlimitedBus ? null : activeBuses.reduce((sum, b) => sum + b.remaining, 0);
  const soldOut = !hasUnlimitedBus && totalRemaining === 0;
  const closed = !event.registrationOpen || soldOut;

  return { status: closed ? "closed" : "open", totalCapacity, totalRemaining, soldOut, closed };
}

const STATUS_OPTIONS = [
  { value: "all", label: "Alle Status" },
  { value: "open", label: "🎉 Anmeldung möglich" },
  { value: "locked", label: "🔒 Vorabzugang" },
  { value: "comingSoon", label: "⏳ Coming Soon" },
  { value: "closed", label: "⛔ Geschlossen/Ausgebucht" },
];

export default function HomePage() {
  const [events, setEvents] = useState(null);
  const [error, setError] = useState("");
  const [tab, setTab] = useState("ours");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortBy, setSortBy] = useState("date");

  useEffect(() => {
    api
      .get("/events")
      .then(setEvents)
      .catch((err) => setError(err.message));
  }, []);

  const visibleEvents = (events || [])
    .filter((event) => Boolean(event.isExternal) === (tab === "external"))
    .map((event) => ({ ...event, meta: getEventMeta(event) }))
    .filter((event) => !search.trim() || event.title.toLowerCase().includes(search.trim().toLowerCase()))
    .filter((event) => statusFilter === "all" || event.meta.status === statusFilter)
    .sort((a, b) => {
      if (sortBy === "name") return a.title.localeCompare(b.title, "de");
      const da = a.eventDate ? new Date(a.eventDate).getTime() : Infinity;
      const db = b.eventDate ? new Date(b.eventDate).getTime() : Infinity;
      return da - db;
    });

  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <h1 className="text-2xl font-bold mb-2 text-teal-900">🎉 Info zu Veranstaltungen</h1>
      <p className="text-sm text-gray-600 mb-6 text-justify">
        Die Bezahlung erfolgt per PayPal. Bei anderen Zahlungsmethoden melde dich bitte ganz normal wie gewohnt
        an und schreib uns anschließend über das Kontaktformular weiter unten. Bitte beachte: Damit wir deine
        Zahlung zuordnen können, gib beim Bezahlen als Kommentar deinen Namen an, falls er nicht ohnehin
        ersichtlich ist. Fix dabei bist du erst, sobald deine Zahlung eingegangen ist und du die
        Bestätigungsmail erhalten hast. Jede Zahlung wird manuell geprüft, daher kann es etwas dauern, bis
        die Bestätigungsmail kommt.
      </p>

      <div className="flex gap-2 mb-6 border-b">
        <button
          type="button"
          onClick={() => setTab("ours")}
          className={`px-3 py-2 text-sm font-semibold border-b-2 -mb-px transition-colors ${
            tab === "ours" ? "border-teal-600 text-teal-800" : "border-transparent text-gray-500 hover:text-gray-700"
          }`}
        >
          🚌 Unsere Veranstaltungen
        </button>
        <button
          type="button"
          onClick={() => setTab("external")}
          className={`px-3 py-2 text-sm font-semibold border-b-2 -mb-px transition-colors ${
            tab === "external"
              ? "border-amber-600 text-amber-800"
              : "border-transparent text-gray-500 hover:text-gray-700"
          }`}
        >
          🤝 Externe Veranstaltungen
        </button>
      </div>

      {tab === "external" && (
        <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 mb-6">
          Für die Inhalte der externen Veranstaltungen sind die jeweiligen Ansprechpersonen verantwortlich.
        </p>
      )}

      <div className="flex flex-wrap items-center gap-2 mb-6">
        <input
          type="text"
          placeholder="Suche nach Titel…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 min-w-[160px] border rounded-lg px-3 py-2 text-sm"
        />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="border rounded-lg px-3 py-2 text-sm"
        >
          {STATUS_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          className="border rounded-lg px-3 py-2 text-sm"
        >
          <option value="date">Sortieren: Datum</option>
          <option value="name">Sortieren: Name</option>
        </select>
      </div>

      {error && <p className="text-red-600">{error}</p>}
      {!events && !error && <p className="text-gray-500">Lade...</p>}
      {events && visibleEvents.length === 0 && (
        <p className="text-gray-500">
          {events.filter((e) => Boolean(e.isExternal) === (tab === "external")).length === 0
            ? tab === "external"
              ? "Aktuell keine externen Veranstaltungen gelistet."
              : "Aktuell sind keine Veranstaltungen geplant."
            : "Keine Treffer für diese Filter."}
        </p>
      )}

      <div className="space-y-4">
        {visibleEvents.map((event) => {
          if (event.meta.status === "locked") {
            return (
              <Link
                key={event.id}
                to={`/veranstaltung/${event.slug}`}
                className="relative block bg-gradient-to-br from-amber-50 to-white border-2 border-amber-300 rounded-xl pl-6 pr-5 py-5 shadow-md hover:shadow-xl hover:border-amber-500 hover:-translate-y-0.5 transition-all overflow-hidden"
              >
                <span className="absolute left-0 top-0 bottom-0 w-1.5 bg-amber-500" aria-hidden="true" />
                <div className="flex items-start gap-3">
                  {event.imageUrl && (
                    <img
                      src={event.imageUrl}
                      alt=""
                      className="w-14 h-14 shrink-0 rounded-lg object-cover border border-amber-200"
                    />
                  )}
                  <div className="min-w-0">
                    <span className="inline-block text-[11px] font-bold uppercase tracking-wide text-amber-700 bg-amber-100 rounded-full px-2 py-0.5 mb-1">
                      🔒 Vorabzugang
                    </span>
                    <h2 className="text-lg font-semibold text-amber-950">{event.title}</h2>
                    {event.isExternal && (
                      <p className="text-xs text-amber-600 mt-0.5">
                        {event.externalOrganizer || "Externer Verein"}
                        {event.externalContactEmail && ` · ${event.externalContactEmail}`}
                      </p>
                    )}
                    <p className="text-sm text-amber-700 mt-2 font-medium">Nur mit Passwort sichtbar</p>
                  </div>
                </div>
              </Link>
            );
          }

          if (event.meta.status === "comingSoon") {
            return (
              <Link
                key={event.id}
                to={`/veranstaltung/${event.slug}`}
                className="block bg-stone-50 border-2 border-dashed border-stone-300 rounded-xl p-5 opacity-90 hover:opacity-100 hover:border-stone-400 hover:shadow-sm transition-all"
              >
                <div className="flex items-start gap-3">
                  {event.imageUrl && (
                    <img
                      src={event.imageUrl}
                      alt=""
                      className="w-14 h-14 shrink-0 rounded-lg object-cover border border-stone-200"
                    />
                  )}
                  <div className="min-w-0">
                    <h2 className="text-lg font-semibold text-stone-700">{event.title}</h2>
                    {event.isExternal && (
                      <p className="text-xs text-stone-500 mt-0.5">
                        {event.externalOrganizer || "Externer Verein"}
                        {event.externalContactEmail && ` · ${event.externalContactEmail}`}
                      </p>
                    )}
                    <p className="text-sm text-stone-500 mt-2 font-semibold">
                      ⏳ Coming Soon — jetzt schon Interesse bekunden
                    </p>
                  </div>
                </div>
              </Link>
            );
          }

          const { closed, soldOut, totalCapacity, totalRemaining } = event.meta;

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
              <div className="flex items-start gap-3">
                {event.imageUrl && (
                  <img
                    src={event.imageUrl}
                    alt=""
                    className="w-14 h-14 shrink-0 rounded-lg object-cover border border-gray-200"
                  />
                )}
                <div className="min-w-0 flex-1">
                  <span
                    className={`inline-block text-[11px] font-bold uppercase tracking-wide rounded-full px-2 py-0.5 mb-1 ${
                      closed ? "text-red-700 bg-red-100" : "text-teal-700 bg-teal-100"
                    }`}
                  >
                    {!event.registrationOpen
                      ? "⛔ Anmeldung geschlossen"
                      : soldOut
                        ? "🔴 Ausgebucht"
                        : "🎉 Jetzt anmelden"}
                  </span>
                  <h2 className={`text-lg font-semibold ${closed ? "text-red-950" : "text-teal-950"}`}>
                    {event.title}
                  </h2>
                  {event.isExternal && (
                    <p className="text-xs text-gray-500 mt-0.5">
                      {event.externalOrganizer || "Externer Verein"}
                      {event.externalContactEmail && ` · ${event.externalContactEmail}`}
                    </p>
                  )}
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
                </div>
              </div>
            </Link>
          );
        })}
      </div>

      {tab === "ours" ? (
        <>
          <NewsletterSignup />
          <ContactForm />
        </>
      ) : (
        <ContactForm
          heading="🤝 Eigene Veranstaltung eintragen"
          description="Möchtet ihr als lokaler Verein oder Gruppe eine Veranstaltung auf dieser Seite eintragen? Nehmt Kontakt mit uns auf. Wir richten uns nur an Arnstorf und Umgebung."
        />
      )}
    </div>
  );
}
