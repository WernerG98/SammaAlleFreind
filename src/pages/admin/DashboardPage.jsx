import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../../lib/api.js";
import ConfirmDialog from "../../components/ConfirmDialog.jsx";

export default function DashboardPage() {
  const [events, setEvents] = useState(null);
  const [error, setError] = useState("");
  const [pendingId, setPendingId] = useState(null);
  const [toDelete, setToDelete] = useState(null);

  function load() {
    api
      .get("/admin/events")
      .then(setEvents)
      .catch((err) => setError(err.message));
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

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <h1 className="text-2xl font-bold">Veranstaltungen</h1>
        <Link
          to="/admin/veranstaltungen/neu"
          className="bg-gray-900 text-white rounded px-4 py-2 text-sm font-medium whitespace-nowrap"
        >
          + Neue Veranstaltung
        </Link>
      </div>

      {error && <p className="text-red-600 mb-4">{error}</p>}

      <div className="space-y-3">
        {events?.map((event) => (
          <div
            key={event.id}
            className="bg-white border rounded-lg p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"
          >
            <div className="min-w-0">
              <p className="font-semibold break-words">
                {event.title} {event.comingSoon && <span className="text-xs text-gray-400">(Coming Soon)</span>}
                {!event.comingSoon && !event.isOpen && (
                  <span className="text-xs text-gray-400">(geschlossen)</span>
                )}
              </p>
              <p className="text-sm text-gray-500">
                {event.eventDate ? new Date(event.eventDate).toLocaleDateString("de-DE") : "Datum offen"} ·{" "}
                {event._count.registrations} Anmeldungen · {event.buses.length} Bus(se)
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
