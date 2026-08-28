import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { api } from "../lib/api.js";

export default function PaymentPage() {
  const { id } = useParams();
  const [registration, setRegistration] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    api
      .get(`/registrations/${id}`)
      .then(setRegistration)
      .catch((err) => setError(err.message));
  }, [id]);

  if (error) {
    return <p className="max-w-lg mx-auto px-4 py-12 text-red-600">{error}</p>;
  }
  if (!registration) {
    return <p className="max-w-lg mx-auto px-4 py-12 text-gray-500">Lade...</p>;
  }

  const { event, bus, firstName, paid } = registration;
  const reference = `${firstName}, ${registration.lastName}, ${event.title}`;

  return (
    <div className="max-w-lg mx-auto px-4 py-12">
      <h1 className="text-2xl font-bold">🎉 Fast geschafft!</h1>
      <p className="mt-2 text-gray-700">
        Deine Anmeldung für <strong>{event.title}</strong> (Bus: {bus.name}) ist eingegangen.
      </p>

      {paid ? (
        <div className="mt-6 bg-emerald-50 border border-emerald-200 rounded-xl p-5 text-emerald-800">
          Deine Zahlung wurde bereits bestätigt. Du bist fest dabei — wir haben dir eine Bestätigungsmail
          geschickt.
        </div>
      ) : (
        <div className="mt-6 bg-white border rounded-xl p-6 space-y-4 shadow-sm">
          <h2 className="font-semibold">Bezahlung per PayPal</h2>
          {event.pricePerPerson && (
            <p>
              Bitte überweise <strong>{Number(event.pricePerPerson).toFixed(2)} €</strong> pro Person.
            </p>
          )}
          <p>
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
            <p className="inline-block bg-amber-50 border border-amber-200 text-amber-800 rounded px-4 py-2 font-medium">
              Link folgt bald
            </p>
          )}
          <p className="text-sm text-gray-500">
            {event.paypalLink
              ? "Sobald deine Zahlung bei uns erfasst wurde, bekommst du automatisch eine Bestätigungsmail und dein Platz ist reserviert. Das kann etwas dauern, da wir jede Person manuell bestätigen."
              : "Der Zahlungslink wird in Kürze ergänzt. Du bist schon vorgemerkt — wir informieren dich, sobald du bezahlen kannst."}
          </p>
        </div>
      )}
    </div>
  );
}
