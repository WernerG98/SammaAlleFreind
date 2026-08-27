import { useEffect, useState } from "react";
import { api } from "../../lib/api.js";
import ConfirmDialog from "../../components/ConfirmDialog.jsx";

export default function NewsletterSubscribersPage() {
  const [subscribers, setSubscribers] = useState(null);
  const [error, setError] = useState("");
  const [pendingId, setPendingId] = useState(null);
  const [toRemove, setToRemove] = useState(null);

  function load() {
    api
      .get("/newsletter")
      .then(setSubscribers)
      .catch((err) => setError(err.message));
  }

  useEffect(load, []);

  async function confirmRemove() {
    if (!toRemove) return;
    setError("");
    setPendingId(toRemove.id);
    try {
      await api.delete(`/newsletter?id=${toRemove.id}`);
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
      <h1 className="text-2xl font-bold mb-6">Newsletter-Abonnenten</h1>

      {error && <p className="text-red-600 mb-4">{error}</p>}

      <div className="bg-white border rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-100 text-left">
            <tr>
              <th className="px-4 py-2">E-Mail</th>
              <th className="px-4 py-2">Angemeldet seit</th>
              <th className="px-4 py-2"></th>
            </tr>
          </thead>
          <tbody>
            {subscribers?.map((sub) => (
              <tr key={sub.id} className="border-t">
                <td className="px-4 py-2">{sub.email}</td>
                <td className="px-4 py-2">{new Date(sub.createdAt).toLocaleDateString("de-DE")}</td>
                <td className="px-4 py-2 text-right">
                  <button
                    type="button"
                    disabled={pendingId === sub.id}
                    onClick={() => setToRemove({ id: sub.id, label: sub.email })}
                    className="text-red-600 hover:underline text-xs"
                  >
                    Entfernen
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {subscribers?.length === 0 && (
          <p className="text-gray-500 px-4 py-6">Noch keine Newsletter-Abonnenten.</p>
        )}
      </div>

      <ConfirmDialog
        open={!!toRemove}
        title="Abonnent entfernen?"
        message={`${toRemove?.label} wird aus dem Newsletter entfernt und erhält eine Info-E-Mail darüber. Das kann nicht rückgängig gemacht werden.`}
        onConfirm={confirmRemove}
        onCancel={() => setToRemove(null)}
      />
    </div>
  );
}
