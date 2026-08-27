import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { api } from "../lib/api.js";

export default function UnsubscribePage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const [status, setStatus] = useState("pending");

  useEffect(() => {
    if (!token) {
      setStatus("error");
      return;
    }
    api
      .get(`/newsletter?token=${encodeURIComponent(token)}`)
      .then(() => setStatus("done"))
      .catch(() => setStatus("error"));
  }, [token]);

  return (
    <div className="max-w-lg mx-auto px-4 py-12 text-center">
      {status === "pending" && <p className="text-gray-500">Wird bearbeitet...</p>}
      {status === "done" && <p>Du wurdest erfolgreich vom Newsletter abgemeldet.</p>}
      {status === "error" && <p className="text-red-600">Dieser Abmelde-Link ist ungültig oder wurde bereits verwendet.</p>}
    </div>
  );
}
