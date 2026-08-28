import { Link, Outlet, useLocation } from "react-router-dom";
import Footer from "./Footer.jsx";
import AnnouncementBanner from "./AnnouncementBanner.jsx";

export default function PublicLayout() {
  const location = useLocation();
  const isHome = location.pathname === "/";

  return (
    <div className="min-h-screen w-full flex flex-col bg-gradient-to-br from-stone-200 via-stone-100 to-teal-100">
      <AnnouncementBanner />

      <div className="w-full px-3 sm:px-4 pt-5 sm:pt-6">
        <Link to="/" className="max-w-3xl mx-auto flex items-center gap-2 text-teal-950">
          <img src="/Logo.png" alt="" className="h-9 w-9 rounded-full shadow-sm" />
          <span className="font-bold text-lg tracking-tight">SammaAlleFreind</span>
        </Link>
      </div>

      <div className="flex-1 w-full px-3 py-4 sm:px-4 sm:py-6 md:py-8">
        <div className="max-w-3xl mx-auto bg-white rounded-xl shadow-lg ring-1 ring-black/5 p-3 sm:p-4 md:p-6">
          {!isHome && (
            <Link to="/" className="inline-block text-sm text-teal-700 hover:text-teal-900 mb-4">
              ← Zurück zur Startseite
            </Link>
          )}
          <Outlet />
        </div>
      </div>
      <Footer />
    </div>
  );
}
