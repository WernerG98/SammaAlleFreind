import { useEffect, useState } from "react";
import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import { api } from "../lib/api.js";

const FULL_NAV_LINKS = [
  { to: "/admin", label: "Veranstaltungen" },
  { to: "/admin/statistik", label: "Statistik" },
  { to: "/admin/newsletter", label: "Newsletter" },
  { to: "/admin/newsletter/abonnenten", label: "Abonnenten" },
  { to: "/admin/banner", label: "Banner" },
];

const EXTERNAL_NAV_LINKS = [{ to: "/admin", label: "Externe Veranstaltungen" }];

export default function AdminLayout() {
  const [status, setStatus] = useState("checking");
  const [role, setRole] = useState("admin");
  const [menuOpen, setMenuOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    api
      .get("/admin/session")
      .then((s) => {
        setRole(s.role || "admin");
        setStatus("ok");
      })
      .catch(() => {
        setStatus("denied");
        navigate("/admin/login");
      });
  }, [navigate]);

  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname]);

  async function handleLogout() {
    await api.delete("/admin/session");
    navigate("/admin/login");
  }

  if (status !== "ok") {
    return <div className="min-h-screen bg-gray-950 p-8 text-center text-gray-500">Lade...</div>;
  }

  const navLinks = role === "external" ? EXTERNAL_NAV_LINKS : FULL_NAV_LINKS;

  return (
    <div className="min-h-screen bg-gray-950">
      <header className="bg-gray-900 border-b border-gray-800 sticky top-0 z-20">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link to="/admin" className="flex items-center gap-2 font-semibold text-gray-100">
            <img src="/Logo.png" alt="" className="h-7 w-7 rounded-full" />
            <span className="hidden sm:inline">{role === "external" ? "Externer Admin" : "Admin"}</span>
          </Link>

          <nav className="hidden sm:flex items-center gap-4 text-sm font-medium">
            <Link to="/" className="text-gray-500 hover:text-gray-200">
              ← Startseite
            </Link>
            {navLinks.map((link) => (
              <Link key={link.to} to={link.to} className="text-gray-300 hover:text-white">
                {link.label}
              </Link>
            ))}
            <button
              type="button"
              onClick={handleLogout}
              className="bg-red-950/60 text-red-300 hover:bg-red-900 rounded-full px-3 py-1.5 font-semibold transition-colors"
            >
              Abmelden
            </button>
          </nav>

          <button
            type="button"
            onClick={() => setMenuOpen((o) => !o)}
            className="sm:hidden w-9 h-9 flex items-center justify-center rounded border border-gray-700 text-gray-300"
            aria-label="Menü"
          >
            {menuOpen ? "✕" : "☰"}
          </button>
        </div>

        {menuOpen && (
          <nav className="sm:hidden border-t border-gray-800 bg-gray-900 px-4 py-3 flex flex-col gap-3 text-sm font-medium">
            <Link to="/" className="text-gray-500">
              ← Startseite
            </Link>
            {navLinks.map((link) => (
              <Link key={link.to} to={link.to} className="text-gray-300">
                {link.label}
              </Link>
            ))}
            <button
              type="button"
              onClick={handleLogout}
              className="text-left bg-red-950/60 text-red-300 rounded-lg px-3 py-2 font-semibold"
            >
              Abmelden
            </button>
          </nav>
        )}
      </header>
      <main className="max-w-5xl mx-auto px-3 sm:px-4 py-6 sm:py-8">
        <Outlet />
      </main>
    </div>
  );
}
