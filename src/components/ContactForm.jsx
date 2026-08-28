import { useState } from "react";
import { api } from "../lib/api.js";

export default function ContactForm() {
  const [form, setForm] = useState({ firstName: "", lastName: "", email: "", message: "" });
  const [status, setStatus] = useState("idle");
  const [error, setError] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setStatus("submitting");
    try {
      await api.post("/contact", form);
      setStatus("done");
      setForm({ firstName: "", lastName: "", email: "", message: "" });
    } catch (err) {
      setError(err.message);
      setStatus("idle");
    }
  }

  return (
    <div className="mt-10 bg-white border rounded-xl p-5 shadow-sm">
      <h2 className="font-semibold mb-1">Kontakt</h2>
      <p className="text-sm text-gray-600 mb-4">
        Andere Zahlungsmethode, Anregungen für weitere Ausflüge oder einfach Feedback? Schreib uns kurz, wir
        melden uns bei dir.
      </p>

      {status === "done" ? (
        <p className="text-sm text-emerald-700">Danke für deine Nachricht, wir melden uns bald bei dir!</p>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <input
              required
              placeholder="Vorname"
              className="w-full border rounded px-3 py-2 text-sm"
              value={form.firstName}
              onChange={(e) => setForm({ ...form, firstName: e.target.value })}
            />
            <input
              required
              placeholder="Name"
              className="w-full border rounded px-3 py-2 text-sm"
              value={form.lastName}
              onChange={(e) => setForm({ ...form, lastName: e.target.value })}
            />
          </div>
          <input
            required
            type="email"
            placeholder="E-Mail-Adresse"
            className="w-full border rounded px-3 py-2 text-sm"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
          />
          <textarea
            required
            rows={3}
            placeholder="Deine Nachricht"
            className="w-full border rounded px-3 py-2 text-sm"
            value={form.message}
            onChange={(e) => setForm({ ...form, message: e.target.value })}
          />

          {error && <p className="text-sm text-red-600">{error}</p>}

          <button
            type="submit"
            disabled={status === "submitting"}
            className="bg-violet-600 hover:bg-violet-700 text-white rounded-lg px-4 py-2 text-sm font-medium disabled:opacity-50 transition-colors"
          >
            {status === "submitting" ? "Wird gesendet…" : "Nachricht senden"}
          </button>
        </form>
      )}
    </div>
  );
}
