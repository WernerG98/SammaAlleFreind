import { Outlet } from "react-router-dom";
import Footer from "./Footer.jsx";

export default function PublicLayout() {
  return (
    <div
      className="min-h-screen w-full flex flex-col bg-slate-950 bg-cover bg-top bg-no-repeat"
      style={{ backgroundImage: "url(/background.png)" }}
    >
      <div className="flex-1 w-full px-4 py-8 md:py-12 bg-slate-950/40">
        <div className="max-w-3xl mx-auto bg-white/95 backdrop-blur-sm rounded-xl shadow-2xl p-4 md:p-6">
          <Outlet />
        </div>
      </div>
      <Footer />
    </div>
  );
}
