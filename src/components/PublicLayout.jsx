import { Link, Outlet, useLocation } from "react-router-dom";
import Footer from "./Footer.jsx";
import AnnouncementBanner from "./AnnouncementBanner.jsx";

export default function PublicLayout() {
  const location = useLocation();
  const isHome = location.pathname === "/";

  return (
    <div className="min-h-screen w-full flex flex-col bg-gray-950">
      <AnnouncementBanner />

      <div className="w-full px-3 sm:px-4 pt-6 sm:pt-8">
        <Link to="/" className="max-w-3xl mx-auto flex items-center gap-3 sm:gap-4 text-gray-100">
          <img
            src="/Logo.png"
            alt=""
            className="h-16 w-16 sm:h-20 sm:w-20 rounded-full shadow-md ring-2 ring-gray-700"
          />
          <span className="flex flex-col">
            <span className="font-extrabold text-3xl sm:text-4xl tracking-tight text-white">
              SammaAlleFreind
            </span>
            <span className="text-sm sm:text-base font-medium text-teal-400/90">
              Kampf gegen Langeweile in Arnstorf und Umgebung 😉
            </span>
          </span>
        </Link>
      </div>

      <div className="flex-1 w-full px-3 py-4 sm:px-4 sm:py-6 md:py-8">
        <div className="max-w-3xl mx-auto bg-gray-900 rounded-xl shadow-lg ring-1 ring-white/10 p-3 sm:p-4 md:p-6">
          {!isHome && (
            <Link to="/" className="inline-block text-sm text-teal-400 hover:text-teal-300 mb-4">
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
