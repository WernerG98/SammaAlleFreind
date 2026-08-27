import { Link, Outlet, useLocation } from "react-router-dom";
import Footer from "./Footer.jsx";

export default function PublicLayout() {
  const location = useLocation();
  const isHome = location.pathname === "/";

  return (
    <div
      className="min-h-screen w-full flex flex-col bg-slate-950 bg-contain bg-center bg-no-repeat"
      style={{ backgroundImage: "url(/background.png)" }}
    >
      <div className="flex-1 w-full px-3 py-6 sm:px-4 sm:py-8 md:py-12">
        <div className="max-w-3xl mx-auto bg-white/75 backdrop-blur-md rounded-xl shadow-2xl p-3 sm:p-4 md:p-6">
          {!isHome && (
            <Link to="/" className="inline-block text-sm text-gray-500 hover:text-gray-800 mb-4">
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
