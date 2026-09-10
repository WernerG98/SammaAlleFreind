import { Link, Outlet, useLocation } from "react-router-dom";
import Footer from "./Footer.jsx";
import AnnouncementBanner from "./AnnouncementBanner.jsx";

export default function PublicLayout() {
  const location = useLocation();
  const isHome = location.pathname === "/";

  return (
    <div className="min-h-screen w-full flex flex-col bg-gray-950 relative overflow-x-hidden">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute top-0 left-1/2 -translate-x-1/2 w-[640px] h-[320px] bg-teal-500/10 blur-3xl rounded-full"
      />

      <AnnouncementBanner />

      <div className="w-full px-3 sm:px-4 pt-6 sm:pt-8 relative">
        <Link to="/" className="max-w-3xl mx-auto flex items-center gap-3 sm:gap-4 text-gray-100 group">
          <img
            src="/Logo.png"
            alt=""
            className="h-16 w-16 sm:h-20 sm:w-20 rounded-full shadow-md ring-2 ring-gray-700 transition-transform group-hover:scale-105 group-hover:ring-teal-600"
          />
          <span className="flex flex-col">
            <span className="font-extrabold text-3xl sm:text-4xl tracking-tight text-white bg-gradient-to-r from-white to-teal-200 bg-clip-text">
              SammaAlleFreind
            </span>
            <span className="text-sm sm:text-base font-medium text-teal-400/90">
              Kampf gegen Langeweile in Arnstorf und Umgebung 😉
            </span>
          </span>
        </Link>
      </div>

      <div className="flex-1 w-full px-3 py-4 sm:px-4 sm:py-6 md:py-8 relative">
        <div
          key={location.pathname}
          className="max-w-3xl mx-auto bg-gray-900 rounded-xl shadow-lg ring-1 ring-white/10 p-3 sm:p-4 md:p-6 animate-fade-in-up"
        >
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
