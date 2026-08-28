import { useEffect, useState } from "react";
import { api } from "../../lib/api.js";

export default function BannerPage() {
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    api
      .get("/announcement")
      .then((data) => setText((data.messages || []).join("\n")))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setSaved(false);
    setSubmitting(true);
    try {
      const messages = text.split("\n");
      await api.put("/announcement", { messages });
      setSaved(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) return <p className="text-gray-500">Lade...</p>;

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold mb-6 text-gray-100">Laufband-Banner</h1>

      <form onSubmit={handleSubmit} className="space-y-4 bg-gray-900 border border-gray-800 rounded-lg p-6">
        <div>
          <label className="block text-sm font-medium mb-1 text-gray-300">
            Nachrichten (eine pro Zeile)
          </label>
          <textarea
            required
            rows={6}
            className="w-full border border-gray-700 bg-gray-800 text-gray-100 rounded px-3 py-2 text-sm focus:outline-none focus:border-teal-500"
            value={text}
            onChange={(e) => setText(e.target.value)}
          />
          <p className="text-xs text-gray-500 mt-1">
            Jede Zeile wird als eigene Nachricht im durchlaufenden Banner oben auf der Startseite angezeigt.
          </p>
        </div>

        {error && <p className="text-sm text-red-400">{error}</p>}
        {saved && <p className="text-sm text-emerald-400">Gespeichert!</p>}

        <button
          type="submit"
          disabled={submitting}
          className="bg-teal-600 hover:bg-teal-500 text-white rounded px-4 py-2 font-medium disabled:opacity-50 transition-colors"
        >
          {submitting ? "Speichern…" : "Speichern"}
        </button>
      </form>
    </div>
  );
}
