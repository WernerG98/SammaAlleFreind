import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../lib/api.js";

export default function AlreadyRegisteredBox({ slug }) {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [registrationId, setRegistrationId] = useState(null);
  const [error, setError] = useState("");
  const [searching, setSearching] = useState(false);
  const [requestingCancel, setRequestingCancel] = useState(false);
  const [cancelRequested, setCancelRequested] = useState(false);

  async function handleSearch(e) {
    e.preventDefault();
    setError("");
    setRegistrationId(null);
    setSearching(true);
    try {
      const result = await api.post(`/events/${slug}`, { email });
      setRegistrationId(result.registrationId);
    } catch (err) {
      setError(err.message);
    } finally {
      setSearching(false);
    }
  }

  async function handleRequestCancel() {
    setError("");
    setRequestingCancel(true);
    try {
      await api.post(`/registrations/${registrationId}`);
      setCancelRequested(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setRequestingCancel(false);
    }
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="mt-4 text-sm text-teal-400 hover:text-teal-300 underline"
      >
        Bereits angemeldet? Hier Anmeldung stornieren oder nochmal zum Bezahlungslink.
      </button>
    );
  }

  return (
    <div className="mt-4 bg-gray-900 border border-gray-800 rounded-xl p-5 shadow-sm">
      <h2 className="font-semibold text-gray-100 mb-2">Bereits angemeldet?</h2>

      {cancelRequested ? (
        <p className="text-sm text-gray-300">
          Wir haben dir eine E-Mail mit einem Stornierungslink geschickt. Erst wenn du auf diesen Link klickst,
          wird deine Anmeldung storniert — bitte prüfe auch deinen Spam-Ordner.
        </p>
      ) : registrationId ? (
        <div className="space-y-3">
          <p className="text-sm text-gray-300">Wir haben deine Anmeldung gefunden.</p>
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={handleRequestCancel}
              disabled={requestingCancel}
              className="bg-red-600 hover:bg-red-500 text-white rounded-lg px-4 py-2 text-sm font-medium disabled:opacity-50 transition-colors"
            >
              {requestingCancel ? "Wird gesendet…" : "Anmeldung stornieren"}
            </button>
            <button
              type="button"
              onClick={() => navigate(`/anmeldung/${registrationId}/zahlung`)}
              className="bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg px-4 py-2 text-sm font-medium transition-colors"
            >
              Zahlungslink
            </button>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-2">
          <input
            required
            type="email"
            placeholder="Deine E-Mail-Adresse"
            className="flex-1 border border-gray-700 bg-gray-800 text-gray-100 placeholder-gray-500 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-teal-500"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <button
            type="submit"
            disabled={searching}
            className="bg-teal-600 hover:bg-teal-500 text-white rounded-lg px-4 py-2 text-sm font-medium disabled:opacity-50 whitespace-nowrap transition-colors"
          >
            {searching ? "Suche…" : "Anmeldung finden"}
          </button>
        </form>
      )}

      {error && <p className="text-sm text-red-400 mt-2">{error}</p>}
    </div>
  );
}
