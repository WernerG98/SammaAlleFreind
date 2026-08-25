import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { api } from "../../lib/api.js";

export default function RegistrationsPage() {
  const { id } = useParams();
  const [registrations, setRegistrations] = useState(null);
  const [error, setError] = useState("");
  const [pendingId, setPendingId] = useState(null);

  function load() {
    api
      .get(`/admin/registrations?eventId=${id}`)
      .then(setRegistrations)
      .catch((err) => setError(err.message));
  }

  useEffect(load, [id]);

  async function togglePaid(reg) {
    setError("");
    setPendingId(reg.id);
    try {
      await api.post(`/admin/registrations/${reg.id}/toggle-paid`, { paid: !reg.paid });
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

      <div className="bg-white border rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-100 text-left">
            <tr>
              <th className="px-4 py-2">Name</th>
              <th className="px-4 py-2">E-Mail</th>
              <th className="px-4 py-2">Bus</th>
              <th className="px-4 py-2">Newsletter</th>
              <th className="px-4 py-2">Bezahlt</th>
            </tr>
          </thead>
          <tbody>
            {registrations?.map((reg) => (
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
              </tr>
            ))}
          </tbody>
        </table>
        {registrations?.length === 0 && (
          <p className="text-gray-500 px-4 py-6">Noch keine Anmeldungen.</p>
        )}
      </div>
    </div>
  );
}
