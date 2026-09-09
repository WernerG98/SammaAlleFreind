import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { api } from "../lib/api.js";

export default function PaymentPage() {
  const { id } = useParams();
  const [registration, setRegistration] = useState(null);
  const [error, setError] = useState("");
  const [requestingCancel, setRequestingCancel] = useState(false);
  const [cancelRequested, setCancelRequested] = useState(false);
  const [selectedCancelIds, setSelectedCancelIds] = useState(() => new Set([id]));

  useEffect(() => {
    api
      .get(`/registrations/${id}`)
      .then(setRegistration)
      .catch((err) => setError(err.message));
  }, [id]);

  function toggleCancelSelection(personId) {
    setSelectedCancelIds((prev) => {
      const next = new Set(prev);
      if (next.has(personId)) {
        next.delete(personId);
      } else {
        next.add(personId);
      }
      return next;
    });
  }

  async function handleRequestCancel() {
    setError("");
    setRequestingCancel(true);
    try {
      await Promise.all([...selectedCancelIds].map((personId) => api.post(`/registrations/${personId}`)));
      setCancelRequested(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setRequestingCancel(false);
    }
  }

  if (error) {
    return <p className="max-w-lg mx-auto px-4 py-12 text-red-400">{error}</p>;
  }
  if (!registration) {
    return <p className="max-w-lg mx-auto px-4 py-12 text-gray-500">Lade...</p>;
  }

  const { event, bus, firstName, paid, groupMembers } = registration;
  const allPeople = [
    { id: registration.id, name: `${firstName} ${registration.lastName}`, paid },
    ...(groupMembers || []).map((m) => ({ id: m.id, name: `${m.firstName} ${m.lastName}`, paid: m.paid })),
  ];
  const allNames = allPeople.map((p) => p.name);
  const isGroup = allNames.length > 1;
  const unpaidPeople = allPeople.filter((p) => !p.paid);
  const allPaid = unpaidPeople.length === 0;
  const reference = `${allNames.join(" & ")}, ${event.title}`;
  const paymentReference = event.paymentNote ? event.paymentNote.replace("{name}", reference) : reference;
  const hasPayPal = Boolean(event.paypalLink);
  const hasBankTransfer = Boolean(event.iban);
  const hasAnyPaymentMethod = hasPayPal || hasBankTransfer;

  return (
    <div className="max-w-lg mx-auto px-4 py-12">
      <h1 className="text-2xl font-bold text-gray-100">🎉 Fast geschafft!</h1>
      <p className="mt-2 text-gray-300">
        {isGroup ? (
          <>
            Eure Anmeldung für <strong>{event.title}</strong> ({bus.name}) ist eingegangen: {allNames.join(", ")}.
          </>
        ) : (
          <>
            Deine Anmeldung für <strong>{event.title}</strong> ({bus.name}) ist eingegangen.
          </>
        )}
      </p>

      {allPaid ? (
        <div className="mt-6 bg-emerald-950/40 border border-emerald-800 rounded-xl p-5 text-emerald-300">
          {event.pricePerPerson
            ? isGroup
              ? "Die Zahlung wurde bereits bestätigt. Ihr seid fest dabei. Wir haben eine Bestätigungsmail geschickt."
              : "Deine Zahlung wurde bereits bestätigt. Du bist fest dabei. Wir haben dir eine Bestätigungsmail geschickt."
            : "Diese Veranstaltung ist kostenlos, du bist fest dabei! Wir haben dir eine Bestätigungsmail geschickt."}
        </div>
      ) : (
        <div className="mt-6 bg-gray-900 border border-gray-800 rounded-xl p-6 space-y-4 shadow-sm">
          <h2 className="font-semibold text-gray-100">Bezahlung</h2>
          {event.pricePerPerson && (
            <p className="text-gray-300">
              Bitte überweise <strong>{Number(event.pricePerPerson).toFixed(2)} €</strong> pro Person
              {isGroup ? ` für ${unpaidPeople.length} von ${allPeople.length} Personen (${unpaidPeople.map((p) => p.name).join(", ")}).` : "."}
            </p>
          )}

          {event.pricePerPerson && (
            <div className="bg-amber-950/40 border-2 border-amber-700 rounded-lg p-4">
              <p className="text-amber-300 font-semibold flex items-center gap-2">
                <span aria-hidden="true">⚠️</span> Wichtig bei der Zahlung
              </p>
              <p className="text-amber-200 text-sm mt-1">
                Bitte gib bei der Überweisung bzw. bei PayPal genau den folgenden Text als
                Verwendungszweck/Kommentar an, damit wir {isGroup ? "alle Namen" : "deinen Namen"} zuordnen
                können:
              </p>
              <p className="mt-2 bg-gray-900 border border-amber-800 rounded px-3 py-2 font-mono text-amber-100 text-sm break-words">
                {paymentReference}
              </p>
            </div>
          )}

          {hasAnyPaymentMethod ? (
            <div className="space-y-4">
              {hasPayPal && (
                <div>
                  <p className="text-sm font-medium text-gray-300 mb-2">Per PayPal</p>
                  <a
                    href={event.paypalLink}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-block bg-[#0070ba] text-white rounded px-4 py-2 font-medium"
                  >
                    Jetzt per PayPal bezahlen
                  </a>
                </div>
              )}
              {hasBankTransfer && (
                <div className={hasPayPal ? "pt-4 border-t border-gray-800" : ""}>
                  <p className="text-sm font-medium text-gray-300 mb-2">Per Überweisung</p>
                  <dl className="text-sm text-gray-300 space-y-1">
                    {event.accountHolder && (
                      <div className="flex gap-2">
                        <dt className="text-gray-500 w-24 shrink-0">Empfänger:</dt>
                        <dd>{event.accountHolder}</dd>
                      </div>
                    )}
                    <div className="flex gap-2">
                      <dt className="text-gray-500 w-24 shrink-0">IBAN:</dt>
                      <dd className="font-mono">{event.iban}</dd>
                    </div>
                    {event.bic && (
                      <div className="flex gap-2">
                        <dt className="text-gray-500 w-24 shrink-0">BIC:</dt>
                        <dd className="font-mono">{event.bic}</dd>
                      </div>
                    )}
                  </dl>
                </div>
              )}
            </div>
          ) : (
            <p className="inline-block bg-amber-950/40 border border-amber-800 text-amber-300 rounded px-4 py-2 font-medium">
              Zahlungsinfos folgen bald
            </p>
          )}

          <p className="text-sm text-gray-400">
            {hasAnyPaymentMethod
              ? "Sobald deine Zahlung bei uns erfasst wurde, bekommst du automatisch eine Bestätigungsmail und dein Platz ist reserviert. Das kann etwas dauern, da wir jede Zahlung manuell bestätigen."
              : "Die Zahlungsinformationen werden in Kürze ergänzt. Du bist schon vorgemerkt, wir informieren dich, sobald du bezahlen kannst."}
          </p>
        </div>
      )}

      {cancelRequested ? (
        <p className="mt-6 text-sm text-gray-300">
          {selectedCancelIds.size > 1
            ? "Wir haben dir E-Mails mit Stornierungslinks geschickt. Erst wenn du auf einen Link klickst, wird die jeweilige Anmeldung storniert. Bitte prüfe auch deinen Spam-Ordner."
            : "Wir haben dir eine E-Mail mit einem Stornierungslink geschickt. Erst wenn du auf diesen Link klickst, wird die Anmeldung storniert. Bitte prüfe auch deinen Spam-Ordner."}
        </p>
      ) : (
        <div className="mt-6">
          {isGroup && (
            <div className="mb-2 space-y-1.5">
              <p className="text-sm text-gray-400">Wen möchtest du stornieren?</p>
              {allPeople.map((p) => (
                <label key={p.id} className="flex items-center gap-2 text-sm text-gray-300">
                  <input
                    type="checkbox"
                    checked={selectedCancelIds.has(p.id)}
                    onChange={() => toggleCancelSelection(p.id)}
                  />
                  {p.name}
                </label>
              ))}
            </div>
          )}
          <button
            type="button"
            onClick={handleRequestCancel}
            disabled={requestingCancel || selectedCancelIds.size === 0}
            className="text-sm text-red-400 hover:text-red-300 underline disabled:opacity-50"
          >
            {requestingCancel
              ? "Wird gesendet…"
              : isGroup
                ? `Ausgewählte stornieren (${selectedCancelIds.size})`
                : "Anmeldung stornieren"}
          </button>
        </div>
      )}

      {error && <p className="text-sm text-red-400 mt-2">{error}</p>}
    </div>
  );
}
