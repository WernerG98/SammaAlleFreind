import { useEffect, useState } from "react";
import { Link, Outlet, useNavigate } from "react-router-dom";
import { api } from "../lib/api.js";

export default function AdminLayout() {
  const [status, setStatus] = useState("checking");
  const navigate = useNavigate();

  useEffect(() => {
    api
      .get("/admin/session")
      .then(() => setStatus("ok"))
      .catch(() => {
        setStatus("denied");
        navigate("/admin/login");
      });
  }, [navigate]);

  async function handleLogout() {
    await api.delete("/admin/session");
    navigate("/admin/login");
  }

  if (status !== "ok") {
    return <div className="p-8 text-center text-gray-500">Lade...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <nav className="flex gap-4 text-sm font-medium">
            <Link to="/" className="text-gray-500 hover:text-gray-900">
              ← Zur Startseite
            </Link>
            <Link to="/admin" className="text-gray-700 hover:text-gray-900">
              Veranstaltungen
            </Link>
            <Link to="/admin/newsletter" className="text-gray-700 hover:text-gray-900">
              Newsletter
            </Link>
          </nav>
          <button onClick={handleLogout} className="text-sm text-gray-500 hover:text-gray-800">
            Abmelden
          </button>
        </div>
      </header>
      <main className="max-w-5xl mx-auto px-4 py-8">
        <Outlet />
      </main>
    </div>
  );
}
