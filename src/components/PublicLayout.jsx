import { useEffect, useState } from "react";
import { Link, Outlet, useLocation } from "react-router-dom";
import Footer from "./Footer.jsx";
import AnnouncementBanner from "./AnnouncementBanner.jsx";

export default function PublicLayout() {
  const location = useLocation();
  const isHome = location.pathname === "/";
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    function onScroll() {
      setScrolled(window.scrollY > 60);
    }
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div className="min-h-screen w-full flex flex-col bg-gray-950 relative">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute top-0 left-1/2 -translate-x-1/2 w-[90vw] max-w-[640px] h-[320px] bg-teal-500/10 blur-3xl rounded-full"
      />

      <AnnouncementBanner />

      <div
        className={`sticky top-0 z-30 w-full px-3 sm:px-4 transition-[padding] duration-300 ${
          scrolled ? "py-2 bg-gray-950 border-b border-gray-800/60" : "pt-6 sm:pt-8"
        }`}
      >
        <Link to="/" className="max-w-3xl mx-auto flex items-center gap-3 sm:gap-4 text-gray-100 group">
          <img
            src="/Logo.png"
            alt=""
            className={`rounded-full shadow-md ring-2 ring-gray-700 transition-all duration-300 group-hover:scale-105 group-hover:ring-teal-600 ${
              scrolled ? "h-9 w-9 sm:h-10 sm:w-10" : "h-16 w-16 sm:h-20 sm:w-20"
            }`}
          />
          <span className="flex flex-col">
            <span
              className={`font-extrabold tracking-tight text-white bg-gradient-to-r from-white to-teal-200 bg-clip-text transition-all duration-300 ${
                scrolled ? "text-lg sm:text-xl" : "text-3xl sm:text-4xl"
              }`}
            >
              SammaAlleFreind
            </span>
            <span
              className={`text-sm sm:text-base font-medium text-teal-400/90 overflow-hidden transition-all duration-300 ${
                scrolled ? "max-h-0 opacity-0" : "max-h-8 opacity-100"
              }`}
            >
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
