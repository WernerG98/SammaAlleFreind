import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { api } from "../lib/api.js";

export default function CancelConfirmPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const [status, setStatus] = useState("pending");

  useEffect(() => {
    if (!token) {
      setStatus("error");
      return;
    }
    api
      .delete(`/registrations/${encodeURIComponent(token)}`)
      .then(() => setStatus("done"))
      .catch(() => setStatus("error"));
  }, [token]);

  return (
    <div className="max-w-lg mx-auto px-4 py-12 text-center">
      {status === "pending" && <p className="text-gray-500">Wird bearbeitet...</p>}
      {status === "done" && (
        <p className="text-gray-300">
          Deine Anmeldung wurde storniert. Falls du bereits bezahlt hast, bekommst du das Geld in Kürze
          zurücküberwiesen.
        </p>
      )}
      {status === "error" && (
        <p className="text-red-400">Dieser Stornierungslink ist ungültig oder wurde bereits verwendet.</p>
      )}
    </div>
  );
}
