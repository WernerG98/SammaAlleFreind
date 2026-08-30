import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { api } from "../lib/api.js";
import ConfirmDialog from "../components/ConfirmDialog.jsx";

export default function PaymentPage() {
  const { id } = useParams();
  const [registration, setRegistration] = useState(null);
  const [error, setError] = useState("");
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [canceling, setCanceling] = useState(false);
  const [cancelled, setCancelled] = useState(false);

  useEffect(() => {
    api
      .get(`/registrations/${id}`)
      .then(setRegistration)
      .catch((err) => setError(err.message));
  }, [id]);

  async function handleCancel() {
    setError("");
    setCanceling(true);
    try {
      await api.delete(`/registrations/${id}`);
      setShowCancelConfirm(false);
      setCancelled(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setCanceling(false);
    }
  }

  if (error) {
    return <p className="max-w-lg mx-auto px-4 py-12 text-red-400">{error}</p>;
  }
  if (!registration) {
    return <p className="max-w-lg mx-auto px-4 py-12 text-gray-500">Lade...</p>;
  }

  if (cancelled) {
    return (
      <div className="max-w-lg mx-auto px-4 py-12">
        <h1 className="text-2xl font-bold text-gray-100">Abgemeldet</h1>
        <div className="mt-4 bg-gray-900 border border-gray-800 rounded-xl p-5 text-gray-300">
          Deine Anmeldung wurde storniert. Wir haben dir eine Bestätigung per E-Mail geschickt
          {registration.paid ? " — dein Geld wird in Kürze zurücküberwiesen." : "."}
        </div>
      </div>
    );
  }

  const { event, bus, firstName, paid } = registration;
  const reference = `${firstName}, ${registration.lastName}, ${event.title}`;

  return (
    <div className="max-w-lg mx-auto px-4 py-12">
      <h1 className="text-2xl font-bold text-gray-100">🎉 Fast geschafft!</h1>
      <p className="mt-2 text-gray-300">
        Deine Anmeldung für <strong>{event.title}</strong> ({bus.name}) ist eingegangen.
      </p>

      {paid ? (
        <div className="mt-6 bg-emerald-950/40 border border-emerald-800 rounded-xl p-5 text-emerald-300">
          {event.pricePerPerson
            ? "Deine Zahlung wurde bereits bestätigt. Du bist fest dabei — wir haben dir eine Bestätigungsmail geschickt."
            : "Diese Veranstaltung ist kostenlos — du bist fest dabei! Wir haben dir eine Bestätigungsmail geschickt."}
        </div>
      ) : (
        <div className="mt-6 bg-gray-900 border border-gray-800 rounded-xl p-6 space-y-4 shadow-sm">
          <h2 className="font-semibold text-gray-100">Bezahlung per PayPal</h2>
          {event.pricePerPerson && (
            <p className="text-gray-300">
              Bitte überweise <strong>{Number(event.pricePerPerson).toFixed(2)} €</strong> pro Person.
            </p>
          )}
          <p className="text-gray-300">
            Verwendungszweck:{" "}
            <strong>
              {event.paymentNote ? event.paymentNote.replace("{name}", reference) : reference}
            </strong>
          </p>
          {event.paypalLink ? (
            <a
              href={event.paypalLink}
              target="_blank"
              rel="noreferrer"
              className="inline-block bg-[#0070ba] text-white rounded px-4 py-2 font-medium"
            >
              Jetzt per PayPal bezahlen
            </a>
          ) : (
            <p className="inline-block bg-amber-950/40 border border-amber-800 text-amber-300 rounded px-4 py-2 font-medium">
              Link folgt bald
            </p>
          )}
          <p className="text-sm text-gray-400">
            {event.paypalLink
              ? "Sobald deine Zahlung bei uns erfasst wurde, bekommst du automatisch eine Bestätigungsmail und dein Platz ist reserviert. Das kann etwas dauern, da wir jede Person manuell bestätigen."
              : "Der Zahlungslink wird in Kürze ergänzt. Du bist schon vorgemerkt — wir informieren dich, sobald du bezahlen kannst."}
          </p>
        </div>
      )}

      <button
        type="button"
        onClick={() => setShowCancelConfirm(true)}
        className="mt-6 text-sm text-red-400 hover:text-red-300 underline"
      >
        Anmeldung stornieren
      </button>

      <ConfirmDialog
        open={showCancelConfirm}
        title="Anmeldung wirklich stornieren?"
        message={
          paid
            ? "Deine Anmeldung wird entfernt. Da du bereits bezahlt hast, wird das Geld dir zurücküberwiesen."
            : "Deine Anmeldung wird entfernt. Das kann nicht rückgängig gemacht werden."
        }
        confirmLabel={canceling ? "Wird storniert…" : "Ja, stornieren"}
        confirmDisabled={canceling}
        onConfirm={handleCancel}
        onCancel={() => setShowCancelConfirm(false)}
      />
    </div>
  );
}
