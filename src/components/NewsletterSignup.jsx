import { useState } from "react";
import { api } from "../lib/api.js";

export default function NewsletterSignup() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState("idle");
  const [message, setMessage] = useState("");

  async function handle(action) {
    if (!email.trim()) return;
    setStatus("submitting");
    setMessage("");
    try {
      await api.post("/newsletter", { action, email });
      if (action === "unsubscribe") {
        setMessage("Du wurdest erfolgreich vom Newsletter abgemeldet.");
      } else {
        setMessage("Fast geschafft! Wir haben dir eine Bestätigungsmail geschickt — bitte prüfe auch deinen Spam-Ordner.");
      }
      setStatus("done");
      setEmail("");
    } catch (err) {
      setMessage(err.message);
      setStatus("error");
    }
  }

  return (
    <div className="mt-10 bg-white border rounded-lg p-5">
      <h2 className="font-semibold mb-1">Newsletter</h2>
      <p className="text-sm text-gray-600 mb-4">
        Melde dich an, um nichts zu verpassen — oder trag dich hier wieder aus.
      </p>

      <div className="flex flex-col sm:flex-row gap-2">
        <input
          type="email"
          placeholder="Deine E-Mail-Adresse"
          className="flex-1 border rounded px-3 py-2 text-sm"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <button
          type="button"
          onClick={() => handle("subscribe")}
          disabled={status === "submitting" || !email.trim()}
          className="bg-gray-900 text-white rounded px-4 py-2 text-sm font-medium disabled:opacity-50 whitespace-nowrap"
        >
          Anmelden
        </button>
        <button
          type="button"
          onClick={() => handle("unsubscribe")}
          disabled={status === "submitting" || !email.trim()}
          className="border border-gray-300 text-gray-700 rounded px-4 py-2 text-sm font-medium disabled:opacity-50 whitespace-nowrap"
        >
          Abmelden
        </button>
      </div>

      {message && (
        <p className={`text-sm mt-3 ${status === "error" ? "text-red-600" : "text-green-700"}`}>{message}</p>
      )}
    </div>
  );
}
