import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../lib/api.js";
import ContactForm from "../components/ContactForm.jsx";
import NewsletterSignup from "../components/NewsletterSignup.jsx";
import CapacityBar from "../components/CapacityBar.jsx";
import { EventCardSkeleton } from "../components/Skeleton.jsx";

const COUNTDOWN_THRESHOLD_DAYS = 14;

function formatCountdown(eventDate) {
  if (!eventDate) return null;
  const diffMs = new Date(eventDate).getTime() - Date.now();
  if (diffMs <= 0) return null;
  if (diffMs > COUNTDOWN_THRESHOLD_DAYS * 86400000) return null;

  const days = Math.floor(diffMs / 86400000);
  if (days >= 1) return `noch ${days} Tag${days === 1 ? "" : "e"}`;

  const hours = Math.floor(diffMs / 3600000);
  if (hours >= 1) return `noch ${hours} Stunde${hours === 1 ? "" : "n"}`;

  return "gleich";
}

function isUrgentCountdown(countdown) {
  return Boolean(countdown) && !countdown.includes("Tag");
}

function getEventMeta(event) {
  if (event.locked) return { status: event.isPrivate ? "private" : "locked" };
  if (event.comingSoon) return { status: "comingSoon" };
  if (event.noRegistrationRequired) return { status: "public" };

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
  { value: "public", label: "🎉 Öffentlich (keine Anmeldung)" },
  { value: "locked", label: "🔒 Vorabzugang" },
  { value: "private", label: "🔒 Privat" },
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

  const hasActiveFilters = Boolean(search.trim()) || statusFilter !== "all";

  function resetFilters() {
    setSearch("");
    setStatusFilter("all");
  }

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
      <h1 className="text-2xl font-bold mb-2 text-white">🎉 Info zu Veranstaltungen</h1>
      <p className="text-sm text-gray-400 mb-6 text-justify">
        Je nach Veranstaltung kannst du per PayPal oder per Überweisung bezahlen, die jeweils verfügbaren
        Optionen siehst du nach der Anmeldung auf der Zahlungsseite. Bei anderen Zahlungsmethoden melde dich
        bitte ganz normal wie gewohnt an und schreib uns anschließend über das Kontaktformular weiter unten.
        Bitte beachte: Damit wir deine Zahlung zuordnen können, gib beim Bezahlen als Kommentar/Verwendungszweck
        deinen Namen an, falls er nicht ohnehin ersichtlich ist. Fix dabei bist du erst, sobald deine Zahlung
        eingegangen ist und du die Bestätigungsmail erhalten hast. Jede Zahlung wird manuell geprüft, daher
        kann es etwas dauern, bis die Bestätigungsmail kommt.
      </p>

      <div className="flex gap-2 mb-6 border-b border-gray-800">
        <button
          type="button"
          onClick={() => setTab("ours")}
          className={`px-3 py-2 text-sm font-semibold border-b-2 -mb-px transition-colors ${
            tab === "ours" ? "border-teal-500 text-teal-300" : "border-transparent text-gray-500 hover:text-gray-300"
          }`}
        >
          🚌 Unsere Veranstaltungen
        </button>
        <button
          type="button"
          onClick={() => setTab("external")}
          className={`px-3 py-2 text-sm font-semibold border-b-2 -mb-px transition-colors ${
            tab === "external"
              ? "border-amber-500 text-amber-300"
              : "border-transparent text-gray-500 hover:text-gray-300"
          }`}
        >
          🤝 Externe Veranstaltungen
        </button>
      </div>

      {tab === "external" && (
        <p className="text-xs text-amber-300 bg-amber-950/40 border border-amber-800 rounded-lg px-3 py-2 mb-6">
          Für die Inhalte der externen Veranstaltungen sind die jeweiligen Ansprechpersonen verantwortlich.
        </p>
      )}

      <div className="flex flex-wrap items-center gap-2 mb-6">
        <input
          type="text"
          placeholder="Suche nach Titel…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 min-w-[160px] border border-gray-700 bg-gray-800 text-gray-100 placeholder-gray-500 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-teal-500"
        />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="border border-gray-700 bg-gray-800 text-gray-100 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-teal-500"
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
          className="border border-gray-700 bg-gray-800 text-gray-100 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-teal-500"
        >
          <option value="date">Sortieren: Datum</option>
          <option value="name">Sortieren: Name</option>
        </select>
      </div>

      {error && <p className="text-red-400">{error}</p>}
      {!events && !error && (
        <div className="space-y-4">
          <EventCardSkeleton />
          <EventCardSkeleton />
          <EventCardSkeleton />
        </div>
      )}
      {events && visibleEvents.length === 0 && (
        <div className="text-center py-10 px-4 bg-gray-900/50 border border-dashed border-gray-800 rounded-xl">
          <p className="text-3xl mb-2" aria-hidden="true">
            {hasActiveFilters ? "🔍" : "🗓️"}
          </p>
          <p className="text-gray-400 font-medium">
            {events.filter((e) => Boolean(e.isExternal) === (tab === "external")).length === 0
              ? tab === "external"
                ? "Aktuell keine externen Veranstaltungen gelistet."
                : "Aktuell sind keine Veranstaltungen geplant."
              : "Keine Treffer für diese Filter."}
          </p>
          {hasActiveFilters && (
            <button
              type="button"
              onClick={resetFilters}
              className="mt-3 text-sm text-teal-400 hover:text-teal-300 underline active:scale-95 transition-all"
            >
              Filter zurücksetzen
            </button>
          )}
        </div>
      )}

      <div className="space-y-4">
        {visibleEvents.map((event) => {
          const countdown = formatCountdown(event.eventDate);

          if (event.meta.status === "locked" || event.meta.status === "private") {
            return (
              <Link
                key={event.id}
                to={`/veranstaltung/${event.slug}`}
                className="relative block bg-gradient-to-br from-amber-950/30 to-gray-900 border-2 border-amber-800/60 rounded-xl pl-6 pr-5 py-5 shadow-md hover:shadow-xl hover:shadow-amber-950/40 hover:border-amber-600 hover:-translate-y-1 active:scale-[0.99] transition-all overflow-hidden"
              >
                <span className="absolute left-0 top-0 bottom-0 w-1.5 bg-gradient-to-b from-amber-400 to-orange-600" aria-hidden="true" />
                <div className="flex items-start gap-3">
                  <div className="min-w-0 flex-1">
                    <span className="inline-block text-[11px] font-bold uppercase tracking-wide text-white bg-gradient-to-r from-amber-500 to-orange-600 shadow-sm shadow-amber-950/50 rounded-full px-2 py-0.5 mb-1">
                      {event.isPrivate ? "🔒 Privat" : "🔒 Vorabzugang"}
                    </span>
                    <h2 className="text-lg font-semibold text-amber-100">{event.title}</h2>
                    {event.isExternal && (
                      <p className="text-xs text-amber-400 mt-0.5">
                        {event.externalOrganizer || "Externer Verein"}
                        {event.externalContactEmail && ` · ${event.externalContactEmail}`}
                      </p>
                    )}
                    {event.eventDate && (
                      <p className="text-sm text-amber-200/80 mt-1">
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
                        {countdown && (
                          <span className={`ml-2 text-xs font-semibold text-amber-300 ${isUrgentCountdown(countdown) ? "animate-pulse" : ""}`}>
                            ⏳ {countdown}
                          </span>
                        )}
                      </p>
                    )}
                    {event.registrationDeadline && (
                      <p className="text-sm text-amber-200/80 mt-1">
                        Anmeldefrist:{" "}
                        {new Date(event.registrationDeadline).toLocaleDateString("de-DE", {
                          day: "2-digit",
                          month: "2-digit",
                          year: "numeric",
                        })}
                      </p>
                    )}
                    <p className="text-sm text-amber-200/80 mt-1">
                      {event.pricePerPerson
                        ? `${Number(event.pricePerPerson).toLocaleString("de-DE", {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })} € pro Person`
                        : "Kostenlos"}
                    </p>
                    <p className="text-sm text-amber-400 mt-2 font-medium">Nur mit Passwort sichtbar</p>
                  </div>
                  {event.imageUrl && (
                    <img
                      src={event.imageUrl}
                      alt=""
                      className="w-14 h-14 shrink-0 rounded-lg object-cover border border-amber-800/60"
                    />
                  )}
                </div>
              </Link>
            );
          }

          if (event.meta.status === "comingSoon") {
            return (
              <Link
                key={event.id}
                to={`/veranstaltung/${event.slug}`}
                className="block bg-gray-900 border-2 border-dashed border-gray-700 rounded-xl p-5 opacity-90 hover:opacity-100 hover:border-gray-500 hover:shadow-sm hover:-translate-y-0.5 active:scale-[0.99] transition-all"
              >
                <div className="flex items-start gap-3">
                  <div className="min-w-0 flex-1">
                    <h2 className="text-lg font-semibold text-gray-300">{event.title}</h2>
                    {event.isExternal && (
                      <p className="text-xs text-gray-500 mt-0.5">
                        {event.externalOrganizer || "Externer Verein"}
                        {event.externalContactEmail && ` · ${event.externalContactEmail}`}
                      </p>
                    )}
                    {event.eventDate && (
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
                        {countdown && (
                          <span className={`ml-2 text-xs font-semibold text-gray-500 ${isUrgentCountdown(countdown) ? "animate-pulse" : ""}`}>
                            ⏳ {countdown}
                          </span>
                        )}
                      </p>
                    )}
                    <p className="text-sm text-gray-500 mt-2 font-semibold">⏳ Coming Soon</p>
                  </div>
                  {event.imageUrl && (
                    <img
                      src={event.imageUrl}
                      alt=""
                      className="w-14 h-14 shrink-0 rounded-lg object-cover border border-gray-700"
                    />
                  )}
                </div>
              </Link>
            );
          }

          if (event.meta.status === "public") {
            return (
              <Link
                key={event.id}
                to={`/veranstaltung/${event.slug}`}
                className="relative block bg-gradient-to-br from-teal-950/30 to-gray-900 border-2 border-teal-800/60 rounded-xl pl-6 pr-5 py-5 shadow-md hover:shadow-xl hover:shadow-teal-950/40 hover:border-teal-500 hover:-translate-y-1 active:scale-[0.99] transition-all overflow-hidden"
              >
                <span className="absolute left-0 top-0 bottom-0 w-1.5 bg-gradient-to-b from-teal-400 to-emerald-600" aria-hidden="true" />
                <div className="flex items-start gap-3">
                  <div className="min-w-0 flex-1">
                    <span className="inline-block text-[11px] font-bold uppercase tracking-wide rounded-full px-2 py-0.5 mb-1 text-white bg-gradient-to-r from-teal-500 to-emerald-600 shadow-sm shadow-teal-950/50">
                      🎉 Öffentlich, keine Anmeldung nötig
                    </span>
                    <h2 className="text-lg font-semibold text-teal-100">{event.title}</h2>
                    {event.isExternal && (
                      <p className="text-xs text-gray-400 mt-0.5">
                        {event.externalOrganizer || "Externer Verein"}
                        {event.externalContactEmail && ` · ${event.externalContactEmail}`}
                      </p>
                    )}
                    {event.eventDate && (
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
                        {countdown && (
                          <span className={`ml-2 text-xs font-semibold text-teal-300 ${isUrgentCountdown(countdown) ? "animate-pulse" : ""}`}>
                            ⏳ {countdown}
                          </span>
                        )}
                      </p>
                    )}
                  </div>
                  {event.imageUrl && (
                    <img
                      src={event.imageUrl}
                      alt=""
                      className="w-14 h-14 shrink-0 rounded-lg object-cover border border-gray-700"
                    />
                  )}
                </div>
              </Link>
            );
          }

          const { closed, soldOut, totalCapacity, totalRemaining } = event.meta;

          return (
            <Link
              key={event.id}
              to={`/veranstaltung/${event.slug}`}
              className={`relative block rounded-xl pl-6 pr-5 py-5 shadow-md hover:shadow-xl hover:-translate-y-1 active:scale-[0.99] transition-all overflow-hidden border-2 ${
                closed
                  ? "bg-gradient-to-br from-red-950/30 to-gray-900 border-red-800/60 hover:border-red-600 hover:shadow-red-950/40"
                  : "bg-gradient-to-br from-teal-950/30 to-gray-900 border-teal-800/60 hover:border-teal-500 hover:shadow-teal-950/40"
              }`}
            >
              <span
                className={`absolute left-0 top-0 bottom-0 w-1.5 bg-gradient-to-b ${closed ? "from-red-400 to-rose-700" : "from-teal-400 to-emerald-600"}`}
                aria-hidden="true"
              />
              <div className="flex items-start gap-3">
                <div className="min-w-0 flex-1">
                  <span
                    className={`inline-block text-[11px] font-bold uppercase tracking-wide rounded-full px-2 py-0.5 mb-1 text-white shadow-sm ${
                      closed
                        ? "bg-gradient-to-r from-red-500 to-rose-700 shadow-red-950/50"
                        : "bg-gradient-to-r from-teal-500 to-emerald-600 shadow-teal-950/50"
                    }`}
                  >
                    {!event.registrationOpen
                      ? "⛔ Anmeldung geschlossen"
                      : soldOut
                        ? "🔴 Ausgebucht"
                        : "🎉 Jetzt anmelden"}
                  </span>
                  <h2 className={`text-lg font-semibold ${closed ? "text-red-100" : "text-teal-100"}`}>
                    {event.title}
                  </h2>
                  {event.isExternal && (
                    <p className="text-xs text-gray-400 mt-0.5">
                      {event.externalOrganizer || "Externer Verein"}
                      {event.externalContactEmail && ` · ${event.externalContactEmail}`}
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
                    {countdown && (
                      <span
                        className={`ml-2 text-xs font-semibold ${closed ? "text-red-300" : "text-teal-300"} ${isUrgentCountdown(countdown) ? "animate-pulse" : ""}`}
                      >
                        ⏳ {countdown}
                      </span>
                    )}
                  </p>
                  <p className="text-sm text-gray-400 mt-1">
                    {event.pricePerPerson
                      ? `${Number(event.pricePerPerson).toLocaleString("de-DE", {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })} € pro Person`
                      : "Kostenlos"}
                  </p>
                  {!event.registrationOpen && (
                    <p className="text-sm mt-2 font-semibold text-red-400">Anmeldefrist abgelaufen</p>
                  )}
                  {totalCapacity > 0 && (
                    <>
                      <p className={`text-sm mt-1 font-medium ${soldOut ? "text-red-400" : "text-gray-400"}`}>
                        {totalRemaining} von {totalCapacity} Plätzen frei
                      </p>
                      <CapacityBar capacity={totalCapacity} remaining={totalRemaining} className="mt-1.5 max-w-[200px]" />
                    </>
                  )}
                </div>
                {event.imageUrl && (
                  <img
                    src={event.imageUrl}
                    alt=""
                    className="w-14 h-14 shrink-0 rounded-lg object-cover border border-gray-700"
                  />
                )}
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
