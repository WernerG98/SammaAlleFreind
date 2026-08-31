import { useState } from "react";
import { api } from "../lib/api.js";
import Honeypot from "./Honeypot.jsx";

export default function NewsletterSignup() {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [website, setWebsite] = useState("");
  const [status, setStatus] = useState("idle");
  const [message, setMessage] = useState("");

  async function handleSubscribe() {
    if (!email.trim()) return;
    setStatus("submitting");
    setMessage("");
    try {
      await api.post("/newsletter", { email, website });
      setMessage("Fast geschafft! Wir haben dir eine Bestätigungsmail geschickt — bitte prüfe auch deinen Spam-Ordner.");
      setStatus("done");
      setEmail("");
    } catch (err) {
      setMessage(err.message);
      setStatus("error");
    }
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Newsletter öffnen"
        className="fixed bottom-20 right-4 z-40 h-14 rounded-full bg-gray-800 hover:bg-gray-700 border border-gray-700 text-white shadow-lg flex items-center gap-2 px-4 transition-colors"
      >
        <span className="text-2xl">📬</span>
        <span className="font-semibold text-sm">Newsletter</span>
      </button>
    );
  }

  return (
    <div className="fixed bottom-20 right-4 z-40 w-[calc(100vw-2rem)] max-w-sm bg-gray-900 border border-gray-800 rounded-xl shadow-2xl p-5">
      <div className="flex items-start justify-between gap-2 mb-1">
        <h2 className="font-semibold text-gray-100">📬 Newsletter</h2>
        <button
          type="button"
          onClick={() => setOpen(false)}
          aria-label="Schließen"
          className="shrink-0 text-gray-500 hover:text-gray-300 text-lg leading-none"
        >
          ✕
        </button>
      </div>
      <p className="text-sm text-gray-400 mb-4">
        Melde dich an, um nichts zu verpassen. Jede Newsletter-Mail enthält einen Abmelde-Link, falls du keine
        Mails mehr erhalten möchtest.
      </p>

      <Honeypot value={website} onChange={(e) => setWebsite(e.target.value)} />

      <div className="flex flex-col sm:flex-row gap-2">
        <input
          type="email"
          placeholder="Deine E-Mail-Adresse"
          className="flex-1 border border-gray-700 bg-gray-800 text-gray-100 placeholder-gray-500 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-teal-500"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <button
          type="button"
          onClick={handleSubscribe}
          disabled={status === "submitting" || !email.trim()}
          className="bg-teal-600 hover:bg-teal-500 text-white rounded-lg px-4 py-2 text-sm font-medium disabled:opacity-50 whitespace-nowrap transition-colors"
        >
          Anmelden
        </button>
      </div>

      {message && (
        <p className={`text-sm mt-3 ${status === "error" ? "text-red-400" : "text-emerald-400"}`}>{message}</p>
      )}
    </div>
  );
}
