import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../../lib/api.js";

export default function DashboardPage() {
  const [events, setEvents] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    api
      .get("/admin/events")
      .then(setEvents)
      .catch((err) => setError(err.message));
  }, []);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Veranstaltungen</h1>
        <Link to="/admin/veranstaltungen/neu" className="bg-gray-900 text-white rounded px-4 py-2 text-sm font-medium">
          + Neue Veranstaltung
        </Link>
      </div>

      {error && <p className="text-red-600">{error}</p>}

      <div className="space-y-3">
        {events?.map((event) => (
          <div key={event.id} className="bg-white border rounded-lg p-4 flex items-center justify-between">
            <div>
              <p className="font-semibold">
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
            <div className="flex gap-3 text-sm">
              <Link to={`/admin/veranstaltungen/${event.id}/anmeldungen`} className="text-blue-600 hover:underline">
                Anmeldungen
              </Link>
              <Link to={`/admin/veranstaltungen/${event.id}`} className="text-blue-600 hover:underline">
                Bearbeiten
              </Link>
            </div>
          </div>
        ))}
        {events?.length === 0 && <p className="text-gray-500">Noch keine Veranstaltungen angelegt.</p>}
      </div>
    </div>
  );
}
