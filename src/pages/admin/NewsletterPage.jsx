import { useState } from "react";
import { api } from "../../lib/api.js";

export default function NewsletterPage() {
  const [form, setForm] = useState({ subject: "", bodyHtml: "" });
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setResult(null);
    setSubmitting(true);
    try {
      const res = await api.post("/newsletter", { action: "send", ...form });
      setResult(res);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold mb-6 text-gray-100">Newsletter versenden</h1>

      <form onSubmit={handleSubmit} className="space-y-4 bg-gray-900 border border-gray-800 rounded-lg p-6">
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

        {error && <p className="text-sm text-red-400">{error}</p>}
        {result && (
          <p className="text-sm text-emerald-400">
            Versendet an {result.sent} von {result.total} Abonnenten.
            {result.failed.length > 0 && ` Fehlgeschlagen: ${result.failed.join(", ")}`}
          </p>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="bg-teal-600 hover:bg-teal-500 text-white rounded px-4 py-2 font-medium disabled:opacity-50 transition-colors"
        >
          {submitting ? "Wird gesendet…" : "An alle Abonnenten senden"}
        </button>
      </form>
    </div>
  );
}
