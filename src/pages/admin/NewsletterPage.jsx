import { useEffect, useState } from "react";
import { api } from "../../lib/api.js";
import ConfirmDialog from "../../components/ConfirmDialog.jsx";
import { useToast } from "../../components/Toast.jsx";

export default function NewsletterPage() {
  const toast = useToast();
  const [form, setForm] = useState({ subject: "", bodyHtml: "" });
  const [result, setResult] = useState(null);
  const [sendError, setSendError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const [subscribers, setSubscribers] = useState(null);
  const [listError, setListError] = useState("");
  const [pendingId, setPendingId] = useState(null);
  const [toRemove, setToRemove] = useState(null);
  const [search, setSearch] = useState("");
  const [sortField, setSortField] = useState("createdAt");
  const [sortDir, setSortDir] = useState("desc");

  function load() {
    api
      .get("/newsletter")
      .then(setSubscribers)
      .catch((err) => setListError(err.message));
  }

  useEffect(load, []);

  async function handleSubmit(e) {
    e.preventDefault();
    setSendError("");
    setResult(null);
    setSubmitting(true);
    try {
      const res = await api.post("/newsletter", { action: "send", ...form });
      setResult(res);
    } catch (err) {
      setSendError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  async function confirmRemove() {
    if (!toRemove) return;
    setListError("");
    setPendingId(toRemove.id);
    try {
      await api.delete(`/newsletter?id=${toRemove.id}`);
      toast(`${toRemove.label} entfernt.`);
      setToRemove(null);
      load();
    } catch (err) {
      setListError(err.message);
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
          className={`flex items-center gap-1 font-semibold ${active ? "text-gray-100" : "text-gray-500"}`}
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
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold mb-1 text-gray-100">Newsletter</h1>
      <p className="text-sm text-gray-400 mb-5">
        {subscribers === null ? "Lade Abonnentenzahl…" : `Aktuell ${subscribers.length} Abonnenten.`}
      </p>

      <form onSubmit={handleSubmit} className="space-y-4 bg-gray-900 border border-gray-800 rounded-lg p-6">
        <h2 className="font-semibold text-gray-100">Rundmail versenden</h2>
        <div>
          <label className="block text-sm font-medium mb-1 text-gray-300">Betreff</label>
          <input
            required
            className="w-full border border-gray-700 bg-gray-800 text-gray-100 rounded px-3 py-2 focus:outline-none focus:border-teal-500"
            value={form.subject}
            onChange={(e) => setForm({ ...form, subject: e.target.value })}
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1 text-gray-300">Inhalt (HTML wird unterstützt)</label>
          <textarea
            required
            rows={10}
            className="w-full border border-gray-700 bg-gray-800 text-gray-100 rounded px-3 py-2 font-mono text-sm focus:outline-none focus:border-teal-500"
            placeholder="<p>Hallo zusammen, unsere nächste Veranstaltung ist...</p>"
            value={form.bodyHtml}
            onChange={(e) => setForm({ ...form, bodyHtml: e.target.value })}
          />
        </div>

        {sendError && <p className="text-sm text-red-400">{sendError}</p>}
        {result && (
          <p className="text-sm text-emerald-400">
            Versendet an {result.sent} von {result.total} Abonnenten.
            {result.failed.length > 0 && ` Fehlgeschlagen: ${result.failed.join(", ")}`}
          </p>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-400 hover:to-emerald-400 text-white rounded px-4 py-2 font-medium shadow-sm shadow-teal-950/30 disabled:opacity-50 active:scale-[0.98] transition-all"
        >
          {submitting ? "Wird gesendet…" : "An alle Abonnenten senden"}
        </button>
      </form>

      <h2 className="font-semibold text-gray-100 mt-8 mb-3">
        Abonnenten{subscribers ? ` (${subscribers.length})` : ""}
      </h2>

      {listError && <p className="text-red-400 mb-4">{listError}</p>}

      <input
        type="text"
        placeholder="Suche nach E-Mail…"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="w-full sm:w-72 border border-gray-700 bg-gray-900 text-gray-100 placeholder-gray-500 rounded px-3 py-2 text-sm mb-4 focus:outline-none focus:border-teal-500"
      />

      <div className="bg-gray-900 border border-gray-800 rounded-lg overflow-x-auto">
        <table className="w-full text-sm min-w-[420px]">
          <thead className="bg-gray-800 text-left">
            <tr>
              <SortHeader field="email">E-Mail</SortHeader>
              <SortHeader field="createdAt">Angemeldet seit</SortHeader>
              <th className="px-4 py-2"></th>
            </tr>
          </thead>
          <tbody>
            {filteredSubscribers.map((sub) => (
              <tr key={sub.id} className="border-t border-gray-800 text-gray-200">
                <td className="px-4 py-2">{sub.email}</td>
                <td className="px-4 py-2">{new Date(sub.createdAt).toLocaleDateString("de-DE")}</td>
                <td className="px-4 py-2 text-right">
                  <button
                    type="button"
                    disabled={pendingId === sub.id}
                    onClick={() => setToRemove({ id: sub.id, label: sub.email })}
                    className="text-red-400 hover:underline text-xs"
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
