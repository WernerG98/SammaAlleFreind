import { Outlet } from "react-router-dom";
import Footer from "./Footer.jsx";

export default function PublicLayout() {
  return (
    <div className="min-h-screen flex flex-col">
      <div className="flex-1">
        <Outlet />
      </div>
      <Footer />
    </div>
  );
}
