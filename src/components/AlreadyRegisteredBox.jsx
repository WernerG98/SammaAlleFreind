import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../lib/api.js";

export default function AlreadyRegisteredBox({ slug }) {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [registrationId, setRegistrationId] = useState(null);
  const [commentsEnabled, setCommentsEnabled] = useState(false);
  const [comment, setComment] = useState("");
  const [savingComment, setSavingComment] = useState(false);
  const [commentSaved, setCommentSaved] = useState(false);
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
      setCommentsEnabled(result.commentsEnabled);
      setComment(result.comment || "");
    } catch (err) {
      setError(err.message);
    } finally {
      setSearching(false);
    }
  }

  async function handleSaveComment() {
    setError("");
    setSavingComment(true);
    setCommentSaved(false);
    try {
      await api.patch(`/registrations/${registrationId}`, { comment });
      setCommentSaved(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setSavingComment(false);
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
        className="mt-4 w-full flex items-center gap-3 text-left bg-teal-950/40 border border-teal-800 hover:border-teal-600 hover:bg-teal-950/60 rounded-lg px-4 py-3 transition-colors"
      >
        <span className="text-xl shrink-0" aria-hidden="true">
          ✏️
        </span>
        <span className="text-sm text-teal-300">
          <strong className="font-semibold text-teal-200">Bereits angemeldet?</strong> Hier Anmeldung stornieren,
          Kommentar bearbeiten oder nochmal zum Bezahlungslink.
        </span>
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

          {commentsEnabled && (
            <div className="border border-teal-800/60 bg-teal-950/20 rounded-lg p-3">
              <label className="block text-sm font-medium mb-1 text-teal-200">✏️ Dein Kommentar</label>
              <textarea
                rows={3}
                className="w-full border border-gray-700 bg-gray-800 text-gray-100 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-teal-500"
                value={comment}
                onChange={(e) => {
                  setComment(e.target.value);
                  setCommentSaved(false);
                }}
              />
              <div className="flex items-center gap-3 mt-2">
                <button
                  type="button"
                  onClick={handleSaveComment}
                  disabled={savingComment}
                  className="bg-teal-600 hover:bg-teal-500 text-white rounded-lg px-4 py-2 text-sm font-medium disabled:opacity-50 transition-colors"
                >
                  {savingComment ? "Wird gespeichert…" : "Kommentar speichern"}
                </button>
                {commentSaved && <span className="text-sm text-emerald-400">Gespeichert!</span>}
              </div>
            </div>
          )}
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
