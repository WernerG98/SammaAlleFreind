import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../../lib/api.js";

function StatTile({ label, value, sub, accent = "text-gray-100" }) {
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
      <p className="text-xs text-gray-500 mb-1">{label}</p>
      <p className={`text-2xl font-bold ${accent}`}>{value}</p>
      {sub && <p className="text-xs text-gray-500 mt-1">{sub}</p>}
    </div>
  );
}

export default function StatsPage() {
  const [stats, setStats] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    api
      .get("/admin/events?stats=1")
      .then(setStats)
      .catch((err) => setError(err.message));
  }, []);

  if (error) return <p className="text-red-400">{error}</p>;
  if (!stats) return <p className="text-gray-500">Lade...</p>;

  const maxMonthly = Math.max(1, ...stats.monthlyRegistrations.map((m) => m.count));
  const maxTopEvent = Math.max(1, ...stats.topEvents.map((e) => e.registrations));

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6 text-gray-100">Statistik</h1>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-8">
        <StatTile
          label="Veranstaltungen"
          value={stats.totalEvents}
          sub={`${stats.ourEvents} eigene · ${stats.externalEvents} extern`}
        />
        <StatTile
          label="Anmeldungen"
          value={stats.totalRegistrations}
          sub={`${stats.paidRegistrations} bezahlt · ${stats.unpaidRegistrations} offen`}
        />
        <StatTile
          label="Einnahmen"
          value={`${stats.totalRevenue.toLocaleString("de-DE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €`}
          sub="eigene Veranstaltungen, bezahlt"
          accent="text-emerald-400"
        />
        <StatTile label="Warteliste" value={stats.totalInterests} sub="Einträge insgesamt" />
        <StatTile
          label="Newsletter-Abonnenten"
          value={stats.totalSubscribers}
          sub={`${stats.newsletterOptIns} über Anmeldung dazugekommen`}
        />
        <StatTile label="Coming Soon" value={stats.comingSoonEvents} sub="angekündigt, noch kein Termin fix" />
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 mb-8">
        <h2 className="font-semibold text-gray-100 mb-4">Anmeldungen pro Monat</h2>
        <div className="flex items-end gap-3 h-32">
          {stats.monthlyRegistrations.map((m) => (
            <div key={m.label} className="flex-1 flex flex-col items-center justify-end gap-1.5 h-full">
              <span className="text-xs text-gray-400">{m.count}</span>
              <div
                className="w-full max-w-[36px] rounded-t bg-teal-500"
                style={{ height: `${(m.count / maxMonthly) * 100}%`, minHeight: m.count > 0 ? "4px" : "0" }}
              />
              <span className="text-xs text-gray-500">{m.label}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
        <h2 className="font-semibold text-gray-100 mb-4">Beliebteste Veranstaltungen</h2>
        {stats.topEvents.length === 0 ? (
          <p className="text-sm text-gray-500">Noch keine Anmeldungen vorhanden.</p>
        ) : (
          <div className="space-y-3">
            {stats.topEvents.map((event) => (
              <Link
                key={event.id}
                to={`/admin/veranstaltungen/${event.id}/anmeldungen`}
                className="block group"
              >
                <div className="flex items-center justify-between text-sm mb-1">
                  <span className="text-gray-200 group-hover:text-teal-300 truncate pr-2">
                    {event.title}
                    {event.isExternal && <span className="text-xs text-amber-400 ml-1">(extern)</span>}
                  </span>
                  <span className="text-gray-400 shrink-0">{event.registrations}</span>
                </div>
                <div className="h-1.5 w-full rounded-full bg-gray-800 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-teal-500 group-hover:bg-teal-400 transition-all"
                    style={{ width: `${(event.registrations / maxTopEvent) * 100}%` }}
                  />
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
