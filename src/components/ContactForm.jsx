import { useState } from "react";
import { api } from "../lib/api.js";
import Honeypot from "./Honeypot.jsx";

export default function ContactForm({
  heading = "💌 Kontakt",
  description = "Andere Zahlungsmethode, Anregungen für weitere Ausflüge oder einfach Feedback? Schreib uns kurz, wir melden uns bei dir.",
}) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ firstName: "", lastName: "", email: "", message: "", website: "" });
  const [status, setStatus] = useState("idle");
  const [error, setError] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setStatus("submitting");
    try {
      await api.post("/contact", form);
      setStatus("done");
      setForm({ firstName: "", lastName: "", email: "", message: "", website: "" });
    } catch (err) {
      setError(err.message);
      setStatus("idle");
    }
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Kontakt öffnen"
        className="fixed bottom-4 right-4 z-40 w-14 h-14 rounded-full bg-teal-800 hover:bg-teal-900 text-white text-2xl shadow-lg flex items-center justify-center transition-colors"
      >
        💌
      </button>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 z-40 w-[calc(100vw-2rem)] max-w-sm bg-white border rounded-xl shadow-2xl p-5">
      <div className="flex items-start justify-between gap-2 mb-1">
        <h2 className="font-semibold">{heading}</h2>
        <button
          type="button"
          onClick={() => setOpen(false)}
          aria-label="Schließen"
          className="shrink-0 text-gray-400 hover:text-gray-600 text-lg leading-none"
        >
          ✕
        </button>
      </div>
      <p className="text-sm text-gray-600 mb-4">{description}</p>

      {status === "done" ? (
        <p className="text-sm text-emerald-700">Danke für deine Nachricht, wir melden uns bald bei dir!</p>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-3">
          <Honeypot value={form.website} onChange={(e) => setForm({ ...form, website: e.target.value })} />
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
            className="bg-teal-800 hover:bg-teal-900 text-white rounded-lg px-4 py-2 text-sm font-medium disabled:opacity-50 transition-colors"
          >
            {status === "submitting" ? "Wird gesendet…" : "Nachricht senden"}
          </button>
        </form>
      )}
    </div>
  );
}
