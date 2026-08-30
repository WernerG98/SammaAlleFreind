import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../lib/api.js";
import ConfirmDialog from "./ConfirmDialog.jsx";

export default function AlreadyRegisteredBox({ slug }) {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [registrationId, setRegistrationId] = useState(null);
  const [error, setError] = useState("");
  const [searching, setSearching] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [canceling, setCanceling] = useState(false);
  const [cancelled, setCancelled] = useState(false);

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

  async function handleCancel() {
    setError("");
    setCanceling(true);
    try {
      await api.delete(`/registrations/${registrationId}`);
      setShowCancelConfirm(false);
      setCancelled(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setCanceling(false);
    }
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="mt-4 text-sm text-teal-400 hover:text-teal-300 underline"
      >
        Bereits angemeldet? Zur Zahlung oder zum Abmelden
      </button>
    );
  }

  return (
    <div className="mt-4 bg-gray-900 border border-gray-800 rounded-xl p-5 shadow-sm">
      <h2 className="font-semibold text-gray-100 mb-2">Bereits angemeldet?</h2>

      {cancelled ? (
        <p className="text-sm text-gray-300">
          Deine Anmeldung wurde storniert. Wir haben dir eine Bestätigung per E-Mail geschickt.
        </p>
      ) : registrationId ? (
        <div className="space-y-3">
          <p className="text-sm text-gray-300">Wir haben deine Anmeldung gefunden.</p>
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => navigate(`/anmeldung/${registrationId}/zahlung`)}
              className="bg-teal-600 hover:bg-teal-500 text-white rounded-lg px-4 py-2 text-sm font-medium transition-colors"
            >
              Zur Zahlung
            </button>
            <button
              type="button"
              onClick={() => setShowCancelConfirm(true)}
              className="text-sm text-red-400 hover:text-red-300 underline"
            >
              Anmeldung stornieren
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

      <ConfirmDialog
        open={showCancelConfirm}
        title="Anmeldung wirklich stornieren?"
        message="Deine Anmeldung wird entfernt. Falls du bereits bezahlt hast, wird dir das Geld zurücküberwiesen. Das kann nicht rückgängig gemacht werden."
        confirmLabel={canceling ? "Wird storniert…" : "Ja, stornieren"}
        confirmDisabled={canceling}
        onConfirm={handleCancel}
        onCancel={() => setShowCancelConfirm(false)}
      />
    </div>
  );
}
