import { useState } from "react";
import { api } from "../lib/api.js";
import Honeypot from "./Honeypot.jsx";

export default function NewsletterSignup() {
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

  return (
    <div className="mt-10 bg-white border rounded-xl p-5 shadow-sm">
      <h2 className="font-semibold mb-1">📬 Newsletter</h2>
      <p className="text-sm text-gray-600 mb-4">
        Melde dich an, um nichts zu verpassen. Jede Newsletter-Mail enthält einen Abmelde-Link, falls du keine
        Mails mehr erhalten möchtest.
      </p>

      <Honeypot value={website} onChange={(e) => setWebsite(e.target.value)} />

      <div className="flex flex-col sm:flex-row gap-2">
        <input
          type="email"
          placeholder="Deine E-Mail-Adresse"
          className="flex-1 border rounded-lg px-3 py-2 text-sm"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <button
          type="button"
          onClick={handleSubscribe}
          disabled={status === "submitting" || !email.trim()}
          className="bg-teal-800 hover:bg-teal-900 text-white rounded-lg px-4 py-2 text-sm font-medium disabled:opacity-50 whitespace-nowrap transition-colors"
        >
          Anmelden
        </button>
      </div>

      {message && (
        <p className={`text-sm mt-3 ${status === "error" ? "text-red-600" : "text-emerald-700"}`}>{message}</p>
      )}
    </div>
  );
}
