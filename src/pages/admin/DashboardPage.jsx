import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../../lib/api.js";
import ConfirmDialog from "../../components/ConfirmDialog.jsx";

export default function DashboardPage() {
  const [events, setEvents] = useState(null);
  const [error, setError] = useState("");
  const [pendingId, setPendingId] = useState(null);
  const [toDelete, setToDelete] = useState(null);
  const [role, setRole] = useState("admin");
  const [search, setSearch] = useState("");
  const [sortField, setSortField] = useState("eventDate");
  const [sortDir, setSortDir] = useState("asc");

  function load() {
    api
      .get("/admin/events")
      .then(setEvents)
      .catch((err) => setError(err.message));
    api
      .get("/admin/session")
      .then((s) => setRole(s.role || "admin"))
      .catch(() => {});
  }

  useEffect(load, []);

  async function confirmDelete() {
    if (!toDelete) return;
    setError("");
    setPendingId(toDelete.id);
    try {
      await api.delete(`/admin/events/${toDelete.id}`);
      setToDelete(null);
      load();
    } catch (err) {
      setError(err.message);
    } finally {
      setPendingId(null);
    }
  }

  function sortValue(event, field) {
    switch (field) {
      case "title":
        return event.title.toLowerCase();
      case "registrations":
        return event._count.registrations;
      case "eventDate":
      default:
        return event.eventDate ? new Date(event.eventDate).getTime() : Infinity;
    }
  }

  const filteredEvents = (events || [])
    .filter((event) => !search.trim() || event.title.toLowerCase().includes(search.trim().toLowerCase()))
    .sort((a, b) => {
      const va = sortValue(a, sortField);
      const vb = sortValue(b, sortField);
      const cmp = va < vb ? -1 : va > vb ? 1 : 0;
      return sortDir === "asc" ? cmp : -cmp;
    });

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <h1 className="text-2xl font-bold">
          {role === "external" ? "Externe Veranstaltungen" : "Veranstaltungen"}
        </h1>
        <Link
          to="/admin/veranstaltungen/neu"
          className="bg-gray-900 text-white rounded px-4 py-2 text-sm font-medium whitespace-nowrap"
        >
          + Neue Veranstaltung
        </Link>
      </div>

      {error && <p className="text-red-600 mb-4">{error}</p>}

      <div className="flex flex-wrap items-center gap-3 mb-4">
        <input
          type="text"
          placeholder="Suche nach Titel…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full sm:w-64 border rounded px-3 py-2 text-sm"
        />
        <select
          value={sortField}
          onChange={(e) => setSortField(e.target.value)}
          className="border rounded px-3 py-2 text-sm"
        >
          <option value="eventDate">Sortieren: Datum</option>
          <option value="title">Sortieren: Titel</option>
          <option value="registrations">Sortieren: Anmeldungen</option>
        </select>
        <button
          type="button"
          onClick={() => setSortDir((d) => (d === "asc" ? "desc" : "asc"))}
          className="border rounded px-3 py-2 text-sm text-gray-700"
        >
          {sortDir === "asc" ? "▲ Aufsteigend" : "▼ Absteigend"}
        </button>
      </div>

      <div className="space-y-3">
        {filteredEvents.map((event) => (
          <div
            key={event.id}
            className="bg-white border rounded-lg p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"
          >
            <div className="min-w-0">
              <p className="font-semibold break-words">
                {event.title}{" "}
                {event.isExternal && (
                  <span className="text-xs text-amber-700 bg-amber-100 rounded-full px-2 py-0.5">
                    🤝 Extern{event.externalOrganizer ? `: ${event.externalOrganizer}` : ""}
                  </span>
                )}{" "}
                {event.comingSoon && <span className="text-xs text-gray-400">(Coming Soon)</span>}
                {!event.comingSoon && !event.isOpen && (
                  <span className="text-xs text-gray-400">(geschlossen)</span>
                )}
              </p>
              <p className="text-sm text-gray-500">
                {event.eventDate
                  ? `${new Date(event.eventDate).toLocaleDateString("de-DE", {
                      timeZone: "Europe/Berlin",
                    })}, ${new Date(event.eventDate).toLocaleTimeString("de-DE", {
                      timeZone: "Europe/Berlin",
                      hour: "2-digit",
                      minute: "2-digit",
                    })} Uhr`
                  : "Datum offen"}{" "}
                ·{" "}
                {event._count.registrations} Anmeldungen · {event.buses.length} Slot(s)
              </p>
            </div>
            <div className="flex gap-3 text-sm shrink-0">
              <Link to={`/admin/veranstaltungen/${event.id}/anmeldungen`} className="text-blue-600 hover:underline">
                Anmeldungen
              </Link>
              <Link to={`/admin/veranstaltungen/${event.id}`} className="text-blue-600 hover:underline">
                Bearbeiten
              </Link>
              <button
                type="button"
                disabled={pendingId === event.id}
                onClick={() => setToDelete({ id: event.id, label: event.title })}
                className="text-red-600 hover:underline"
              >
                Löschen
              </button>
            </div>
          </div>
        ))}
        {events?.length === 0 && <p className="text-gray-500">Noch keine Veranstaltungen angelegt.</p>}
        {events?.length > 0 && filteredEvents.length === 0 && (
          <p className="text-gray-500">Keine Treffer für diese Suche.</p>
        )}
      </div>

      <ConfirmDialog
        open={!!toDelete}
        title="Veranstaltung löschen?"
        message={`"${toDelete?.label}" wird inklusive aller Anmeldungen und Interessenten unwiderruflich gelöscht. Das kann nicht rückgängig gemacht werden.`}
        onConfirm={confirmDelete}
        onCancel={() => setToDelete(null)}
      />
    </div>
  );
}
