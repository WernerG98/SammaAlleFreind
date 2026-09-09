import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../lib/api.js";

function FoundRegistrationCard({ registration, commentsEnabled, selected, onToggleSelect }) {
  const navigate = useNavigate();
  const [comment, setComment] = useState(registration.comment || "");
  const [savingComment, setSavingComment] = useState(false);
  const [commentSaved, setCommentSaved] = useState(false);
  const [error, setError] = useState("");

  async function handleSaveComment() {
    setError("");
    setSavingComment(true);
    setCommentSaved(false);
    try {
      await api.patch(`/registrations/${registration.registrationId}`, { comment });
      setCommentSaved(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setSavingComment(false);
    }
  }

  return (
    <div className="border border-gray-800 rounded-lg p-3 space-y-2">
      <label className="flex items-center gap-2 text-sm text-gray-200 cursor-pointer">
        <input type="checkbox" checked={selected} onChange={onToggleSelect} />
        <span className="font-medium">
          {registration.firstName} {registration.lastName}
        </span>
        <span className="text-gray-500">({registration.busName})</span>
        {registration.paid && <span className="ml-1 text-xs text-emerald-400 font-medium">bezahlt</span>}
      </label>

      <button
        type="button"
        onClick={() => navigate(`/anmeldung/${registration.registrationId}/zahlung`)}
        className="bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg px-3 py-1.5 text-xs font-medium transition-colors"
      >
        Zahlungslink
      </button>

      {commentsEnabled && (
        <div className="border border-teal-800/60 bg-teal-950/20 rounded-lg p-2">
          <label className="block text-xs font-medium mb-1 text-teal-200">✏️ Kommentar</label>
          <textarea
            rows={2}
            className="w-full border border-gray-700 bg-gray-800 text-gray-100 rounded px-2 py-1.5 text-xs focus:outline-none focus:border-teal-500"
            value={comment}
            onChange={(e) => {
              setComment(e.target.value);
              setCommentSaved(false);
            }}
          />
          <div className="flex items-center gap-2 mt-1.5">
            <button
              type="button"
              onClick={handleSaveComment}
              disabled={savingComment}
              className="bg-teal-600 hover:bg-teal-500 text-white rounded px-3 py-1 text-xs font-medium disabled:opacity-50 transition-colors"
            >
              {savingComment ? "Wird gespeichert…" : "Speichern"}
            </button>
            {commentSaved && <span className="text-xs text-emerald-400">Gespeichert!</span>}
          </div>
        </div>
      )}

      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  );
}

export default function AlreadyRegisteredBox({ slug }) {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [registrations, setRegistrations] = useState(null);
  const [commentsEnabled, setCommentsEnabled] = useState(false);
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [requestingCancel, setRequestingCancel] = useState(false);
  const [cancelRequested, setCancelRequested] = useState(false);
  const [error, setError] = useState("");
  const [searching, setSearching] = useState(false);

  async function handleSearch(e) {
    e.preventDefault();
    setError("");
    setRegistrations(null);
    setSelectedIds(new Set());
    setSearching(true);
    try {
      const result = await api.post(`/events/${slug}`, { email });
      setRegistrations(result.registrations);
      setCommentsEnabled(result.commentsEnabled);
    } catch (err) {
      setError(err.message);
    } finally {
      setSearching(false);
    }
  }

  function toggleSelect(registrationId) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(registrationId)) {
        next.delete(registrationId);
      } else {
        next.add(registrationId);
      }
      return next;
    });
  }

  async function handleRequestCancel() {
    setError("");
    setRequestingCancel(true);
    try {
      await Promise.all([...selectedIds].map((registrationId) => api.post(`/registrations/${registrationId}`)));
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

      {registrations ? (
        <div className="space-y-3">
          {cancelRequested ? (
            <p className="text-sm text-gray-300">
              {selectedIds.size > 1
                ? "Wir haben E-Mails mit Stornierungslinks verschickt. Erst wenn du auf einen Link klickst, wird die jeweilige Anmeldung storniert. Bitte prüfe auch deinen Spam-Ordner."
                : "Wir haben eine E-Mail mit einem Stornierungslink verschickt. Erst wenn du auf diesen Link klickst, wird die Anmeldung storniert. Bitte prüfe auch deinen Spam-Ordner."}
            </p>
          ) : (
            <>
              <p className="text-sm text-gray-300">
                {registrations.length > 1
                  ? `Wir haben ${registrations.length} Anmeldungen für diese E-Mail-Adresse gefunden. Zum Stornieren die gewünschten Personen ankreuzen.`
                  : "Wir haben deine Anmeldung gefunden."}
              </p>
              {registrations.map((r) => (
                <FoundRegistrationCard
                  key={r.registrationId}
                  registration={r}
                  commentsEnabled={commentsEnabled}
                  selected={selectedIds.has(r.registrationId)}
                  onToggleSelect={() => toggleSelect(r.registrationId)}
                />
              ))}
              <button
                type="button"
                onClick={handleRequestCancel}
                disabled={requestingCancel || selectedIds.size === 0}
                className="bg-red-600 hover:bg-red-500 text-white rounded-lg px-4 py-2 text-sm font-medium disabled:opacity-50 transition-colors"
              >
                {requestingCancel
                  ? "Wird gesendet…"
                  : registrations.length > 1
                    ? `Ausgewählte stornieren (${selectedIds.size})`
                    : "Anmeldung stornieren"}
              </button>
            </>
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
