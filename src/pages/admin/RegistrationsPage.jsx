import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { api } from "../../lib/api.js";
import ConfirmDialog from "../../components/ConfirmDialog.jsx";

function BulkEmailForm({ eventId }) {
  const [target, setTarget] = useState("paid");
  const [subject, setSubject] = useState("");
  const [bodyHtml, setBodyHtml] = useState("");
  const [status, setStatus] = useState("idle");
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setResult(null);
    setStatus("submitting");
    try {
      const res = await api.post("/admin/events", { action: "send-email", eventId, target, subject, bodyHtml });
      setResult(res);
      setStatus("done");
    } catch (err) {
      setError(err.message);
      setStatus("idle");
    }
  }

  return (
    <div className="mt-8 bg-white border rounded-lg p-5">
      <h2 className="font-semibold mb-3">E-Mail an Teilnehmer senden</h2>
      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="flex gap-4 text-sm">
          <label className="flex items-center gap-2">
            <input type="radio" checked={target === "paid"} onChange={() => setTarget("paid")} />
            Fix dabei (bezahlt)
          </label>
          <label className="flex items-center gap-2">
            <input type="radio" checked={target === "unpaid"} onChange={() => setTarget("unpaid")} />
            Noch nicht bezahlt
          </label>
        </div>
        <input
          required
          placeholder="Betreff"
          className="w-full border rounded px-3 py-2 text-sm"
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
        />
        <textarea
          required
          rows={5}
          placeholder="Inhalt (HTML wird unterstützt)"
          className="w-full border rounded px-3 py-2 text-sm font-mono"
          value={bodyHtml}
          onChange={(e) => setBodyHtml(e.target.value)}
        />

        {error && <p className="text-sm text-red-600">{error}</p>}
        {result && (
          <p className="text-sm text-green-700">
            Versendet an {result.sent} von {result.total} Personen.
            {result.failed.length > 0 && ` Fehlgeschlagen: ${result.failed.join(", ")}`}
          </p>
        )}

        <button
          type="submit"
          disabled={status === "submitting"}
          className="bg-gray-900 text-white rounded px-4 py-2 text-sm font-medium disabled:opacity-50"
        >
          {status === "submitting" ? "Wird gesendet…" : "Senden"}
        </button>
      </form>
    </div>
  );
}

export default function RegistrationsPage() {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [buses, setBuses] = useState([]);
  const [error, setError] = useState("");
  const [pendingId, setPendingId] = useState(null);
  const [toRemove, setToRemove] = useState(null);
  const [busFilter, setBusFilter] = useState("all");

  function load() {
    api
      .get(`/admin/registrations?eventId=${id}`)
      .then(setData)
      .catch((err) => setError(err.message));
    api
      .get(`/admin/events/${id}`)
      .then((event) => setBuses(event.buses))
      .catch(() => {});
  }

  useEffect(load, [id]);

  const registrations = data?.registrations || [];
  const interests = data?.interests || [];

  const busStats = useMemo(() => {
    return buses.map((bus) => {
      const paidCount = registrations.filter((r) => r.busId === bus.id && r.paid).length;
      return { ...bus, paidCount, full: paidCount >= bus.capacity };
    });
  }, [buses, registrations]);

  const filteredRegistrations =
    busFilter === "all" ? registrations : registrations.filter((r) => r.busId === busFilter);

  async function togglePaid(reg) {
    setError("");
    setPendingId(reg.id);
    try {
      await api.post(`/admin/registrations/${reg.id}`, { paid: !reg.paid });
      load();
    } catch (err) {
      setError(err.message);
    } finally {
      setPendingId(null);
    }
  }

  async function changeBus(reg, newBusId) {
    if (newBusId === reg.busId) return;
    setError("");
    setPendingId(reg.id);
    try {
      await api.post(`/admin/registrations/${reg.id}`, { busId: newBusId });
      load();
    } catch (err) {
      setError(err.message);
    } finally {
      setPendingId(null);
    }
  }

  async function confirmRemove() {
    if (!toRemove) return;
    setError("");
    setPendingId(toRemove.id);
    try {
      await api.delete(`/admin/registrations/${toRemove.id}`);
      setToRemove(null);
      load();
    } catch (err) {
      setError(err.message);
    } finally {
      setPendingId(null);
    }
  }

  return (
    <div>
      <Link to="/admin" className="text-sm text-blue-600 hover:underline">
        ← Zurück zur Übersicht
      </Link>
      <h1 className="text-2xl font-bold mt-2 mb-6">Anmeldungen</h1>

      {error && <p className="text-red-600 mb-4">{error}</p>}

      {buses.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-4">
          <button
            type="button"
            onClick={() => setBusFilter("all")}
            className={`text-xs px-3 py-1.5 rounded-full border ${
              busFilter === "all" ? "bg-gray-900 text-white border-gray-900" : "bg-white text-gray-700"
            }`}
          >
            Alle
          </button>
          {busStats.map((bus) => (
            <button
              type="button"
              key={bus.id}
              onClick={() => setBusFilter(bus.id)}
              className={`text-xs px-3 py-1.5 rounded-full border flex items-center gap-1 ${
                busFilter === bus.id
                  ? "bg-gray-900 text-white border-gray-900"
                  : bus.full
                    ? "bg-gray-200 text-gray-500 border-gray-200"
                    : "bg-white text-gray-700"
              }`}
            >
              {bus.full && <span aria-hidden="true">🔒</span>}
              {bus.name} ({bus.paidCount}/{bus.capacity})
            </button>
          ))}
        </div>
      )}

      <div className="bg-white border rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-100 text-left">
            <tr>
              <th className="px-4 py-2">Name</th>
              <th className="px-4 py-2">E-Mail</th>
              <th className="px-4 py-2">Bus</th>
              <th className="px-4 py-2">Newsletter</th>
              <th className="px-4 py-2">Bezahlt</th>
              <th className="px-4 py-2"></th>
            </tr>
          </thead>
          <tbody>
            {filteredRegistrations.map((reg) => (
              <tr key={reg.id} className="border-t">
                <td className="px-4 py-2">
                  {reg.firstName} {reg.lastName}
                </td>
                <td className="px-4 py-2">{reg.email}</td>
                <td className="px-4 py-2">
                  <select
                    className="border rounded px-2 py-1 text-xs"
                    value={reg.busId}
                    disabled={pendingId === reg.id}
                    onChange={(e) => changeBus(reg, e.target.value)}
                  >
                    {buses.map((bus) => (
                      <option key={bus.id} value={bus.id}>
                        {bus.name}
                      </option>
                    ))}
                  </select>
                </td>
                <td className="px-4 py-2">{reg.newsletterOptIn ? "Ja" : "Nein"}</td>
                <td className="px-4 py-2">
                  <input
                    type="checkbox"
                    checked={reg.paid}
                    disabled={pendingId === reg.id}
                    onChange={() => togglePaid(reg)}
                  />
                </td>
                <td className="px-4 py-2 text-right">
                  <button
                    type="button"
                    disabled={pendingId === reg.id}
                    onClick={() => setToRemove({ id: reg.id, label: `${reg.firstName} ${reg.lastName}` })}
                    className="text-red-600 hover:underline text-xs"
                  >
                    Entfernen
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filteredRegistrations.length === 0 && (
          <p className="text-gray-500 px-4 py-6">Keine Anmeldungen in dieser Auswahl.</p>
        )}
      </div>

      {interests.length > 0 && (
        <div className="mt-8">
          <h2 className="font-semibold mb-3">Interessenten (Coming Soon)</h2>
          <div className="bg-white border rounded-lg overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-100 text-left">
                <tr>
                  <th className="px-4 py-2">Name</th>
                  <th className="px-4 py-2">E-Mail</th>
                  <th className="px-4 py-2"></th>
                </tr>
              </thead>
              <tbody>
                {interests.map((int) => (
                  <tr key={int.id} className="border-t">
                    <td className="px-4 py-2">
                      {int.firstName} {int.lastName}
                    </td>
                    <td className="px-4 py-2">{int.email}</td>
                    <td className="px-4 py-2 text-right">
                      <button
                        type="button"
                        disabled={pendingId === int.id}
                        onClick={() => setToRemove({ id: int.id, label: `${int.firstName} ${int.lastName}` })}
                        className="text-red-600 hover:underline text-xs"
                      >
                        Entfernen
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {registrations.length > 0 && <BulkEmailForm eventId={id} />}

      <ConfirmDialog
        open={!!toRemove}
        title="Person entfernen?"
        message={`${toRemove?.label} wird entfernt und erhält eine Info-E-Mail darüber. Das kann nicht rückgängig gemacht werden.`}
        onConfirm={confirmRemove}
        onCancel={() => setToRemove(null)}
      />
    </div>
  );
}
