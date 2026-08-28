import { useEffect, useState } from "react";
import { api } from "../../lib/api.js";
import ConfirmDialog from "../../components/ConfirmDialog.jsx";

export default function NewsletterSubscribersPage() {
  const [subscribers, setSubscribers] = useState(null);
  const [error, setError] = useState("");
  const [pendingId, setPendingId] = useState(null);
  const [toRemove, setToRemove] = useState(null);
  const [search, setSearch] = useState("");
  const [sortField, setSortField] = useState("createdAt");
  const [sortDir, setSortDir] = useState("desc");

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

  function sortValue(sub, field) {
    switch (field) {
      case "email":
        return sub.email.toLowerCase();
      case "createdAt":
        return new Date(sub.createdAt).getTime();
      default:
        return "";
    }
  }

  function toggleSort(field) {
    if (sortField === field) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDir("asc");
    }
  }

  function SortHeader({ field, children }) {
    const active = sortField === field;
    return (
      <th className="px-4 py-2">
        <button
          type="button"
          onClick={() => toggleSort(field)}
          className={`flex items-center gap-1 font-semibold ${active ? "text-gray-900" : "text-gray-500"}`}
        >
          {children}
          <span className="text-xs">{active ? (sortDir === "asc" ? "▲" : "▼") : "↕"}</span>
        </button>
      </th>
    );
  }

  const filteredSubscribers = (subscribers || [])
    .filter((sub) => !search.trim() || sub.email.toLowerCase().includes(search.trim().toLowerCase()))
    .sort((a, b) => {
      const va = sortValue(a, sortField);
      const vb = sortValue(b, sortField);
      const cmp = va < vb ? -1 : va > vb ? 1 : 0;
      return sortDir === "asc" ? cmp : -cmp;
    });

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Newsletter-Abonnenten</h1>

      {error && <p className="text-red-600 mb-4">{error}</p>}

      <input
        type="text"
        placeholder="Suche nach E-Mail…"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="w-full sm:w-72 border rounded px-3 py-2 text-sm mb-4"
      />

      <div className="bg-white border rounded-lg overflow-x-auto">
        <table className="w-full text-sm min-w-[420px]">
          <thead className="bg-gray-100 text-left">
            <tr>
              <SortHeader field="email">E-Mail</SortHeader>
              <SortHeader field="createdAt">Angemeldet seit</SortHeader>
              <th className="px-4 py-2"></th>
            </tr>
          </thead>
          <tbody>
            {filteredSubscribers.map((sub) => (
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
        {subscribers?.length > 0 && filteredSubscribers.length === 0 && (
          <p className="text-gray-500 px-4 py-6">Keine Treffer für diese Suche.</p>
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
