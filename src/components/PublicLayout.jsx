import { useEffect, useRef, useState } from "react";
import { Link, Outlet, useLocation } from "react-router-dom";
import Footer from "./Footer.jsx";

const COMPACT_BAR_HEIGHT = 56;

export default function PublicLayout() {
  const location = useLocation();
  const isHome = location.pathname === "/";
  const headerRef = useRef(null);
  const [showCompactBar, setShowCompactBar] = useState(false);
  const widthClass = isHome ? "max-w-3xl lg:max-w-5xl" : "max-w-3xl";

  // Der große Kopf scrollt ganz normal mit, die schmale feste Leiste blendet ein, sobald er
  // aus dem Bild ist. Die Seitenhöhe ändert sich dabei nie (sonst pendelt der Kopf unten
  // zwischen groß und klein, weil das Verkleinern selbst den Scrollstand verschiebt).
  useEffect(() => {
    function update() {
      if (!headerRef.current) return;
      setShowCompactBar(headerRef.current.getBoundingClientRect().bottom < COMPACT_BAR_HEIGHT);
    }
    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, [isHome]);

  return (
    <div className="min-h-screen w-full flex flex-col bg-gray-950 relative">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute top-0 left-1/2 -translate-x-1/2 w-[90vw] max-w-[640px] h-[320px] bg-teal-500/10 blur-3xl rounded-full"
      />

      <div
        aria-hidden={!showCompactBar}
        className={`fixed inset-x-0 top-0 z-30 border-b border-gray-800/60 bg-gray-950 px-3 sm:px-4 py-2 transition-opacity duration-200 ${
          showCompactBar ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
      >
        <Link
          to="/"
          tabIndex={showCompactBar ? 0 : -1}
          className={`${widthClass} mx-auto flex items-center gap-3 text-gray-100 group`}
        >
          <img
            src="/Logo.png"
            alt=""
            className="h-9 w-9 sm:h-10 sm:w-10 rounded-full shadow-md ring-2 ring-gray-700 group-hover:ring-teal-600"
          />
          <span className="text-lg sm:text-xl font-extrabold tracking-tight text-white bg-gradient-to-r from-white to-teal-200 bg-clip-text">
            SammaAlleFreind
          </span>
        </Link>
      </div>

      <div
        ref={headerRef}
        className={`w-full px-3 sm:px-4 ${
          isHome ? "pt-6 sm:pt-8" : "py-2 border-b border-gray-800/60 sm:border-b-0 sm:pt-8 sm:pb-0"
        }`}
      >
        <Link to="/" className={`${widthClass} mx-auto flex items-center gap-3 sm:gap-4 text-gray-100 group`}>
          <img
            src="/Logo.png"
            alt=""
            className={`rounded-full shadow-md ring-2 ring-gray-700 transition-transform duration-300 group-hover:scale-105 group-hover:ring-teal-600 ${
              isHome ? "h-16 w-16 sm:h-20 sm:w-20" : "h-9 w-9 sm:h-20 sm:w-20"
            }`}
          />
          <span className="flex flex-col">
            <span
              className={`font-extrabold tracking-tight text-white bg-gradient-to-r from-white to-teal-200 bg-clip-text ${
                isHome ? "text-3xl sm:text-4xl" : "text-lg sm:text-4xl"
              }`}
            >
              SammaAlleFreind
            </span>
            <span
              className={`text-sm sm:text-base font-medium text-teal-400/90 ${isHome ? "" : "hidden sm:block"}`}
            >
              Ich mag BIR 🍺
            </span>
          </span>
        </Link>
      </div>

      <div className="flex-1 w-full px-3 py-4 sm:px-4 sm:py-6 md:py-8 relative">
        <div
          key={location.pathname}
          className={`${widthClass} mx-auto bg-gray-900 rounded-xl shadow-lg ring-1 ring-white/10 p-3 sm:p-4 md:p-6 animate-fade-in-up`}
        >
          {!isHome && (
            <Link to="/" className="inline-block text-sm text-teal-400 hover:text-teal-300 mb-4">
              ← Zurück zur Startseite
            </Link>
          )}
          <Outlet />
        </div>
      </div>
      <Footer reserveSpaceForFloatingButtons={isHome} />
    </div>
  );
}
