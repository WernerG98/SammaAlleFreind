import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { api } from "../../lib/api.js";
import ConfirmDialog from "../../components/ConfirmDialog.jsx";

export default function RegistrationsPage() {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [pendingId, setPendingId] = useState(null);
  const [toRemove, setToRemove] = useState(null);

  function load() {
    api
      .get(`/admin/registrations?eventId=${id}`)
      .then(setData)
      .catch((err) => setError(err.message));
  }

  useEffect(load, [id]);

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

  const registrations = data?.registrations || [];
  const interests = data?.interests || [];

  return (
    <div>
      <Link to="/admin" className="text-sm text-blue-600 hover:underline">
        ← Zurück zur Übersicht
      </Link>
      <h1 className="text-2xl font-bold mt-2 mb-6">Anmeldungen</h1>

      {error && <p className="text-red-600 mb-4">{error}</p>}

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
            {registrations.map((reg) => (
              <tr key={reg.id} className="border-t">
                <td className="px-4 py-2">
                  {reg.firstName} {reg.lastName}
                </td>
                <td className="px-4 py-2">{reg.email}</td>
                <td className="px-4 py-2">{reg.bus.name}</td>
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
        {registrations.length === 0 && <p className="text-gray-500 px-4 py-6">Noch keine Anmeldungen.</p>}
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
