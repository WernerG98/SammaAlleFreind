import { useEffect } from "react";
import { useLocation } from "react-router-dom";

const BASE_URL = "https://sammaallefreind.de";

// Sagt Google pro Seite, welche Adresse die echte ist – damit nur sammaallefreind.de
// im Index landet und nicht zusätzlich die .vercel.app-Adresse oder Varianten mit ?…
export default function CanonicalLink() {
  const { pathname } = useLocation();

  useEffect(() => {
    let link = document.querySelector('link[rel="canonical"]');
    if (!link) {
      link = document.createElement("link");
      link.rel = "canonical";
      document.head.appendChild(link);
    }
    const path = pathname.length > 1 ? pathname.replace(/\/+$/, "") : "/";
    link.href = `${BASE_URL}${path}`;
  }, [pathname]);

  return null;
}
