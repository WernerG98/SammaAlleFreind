import { Link } from "react-router-dom";

export default function Footer() {
  return (
    <footer className="mt-16 border-t border-gray-800 py-6 text-center text-xs text-gray-500">
      <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1">
        <Link to="/impressum" className="hover:text-gray-300">
          Impressum
        </Link>
        <span aria-hidden="true">·</span>
        <Link to="/datenschutz" className="hover:text-gray-300">
          Datenschutz
        </Link>
        <span aria-hidden="true">·</span>
        <Link to="/admin/login" className="hover:text-gray-300">
          Admin-Login
        </Link>
      </div>
      <div className="mt-2">
        <a
          href="https://glueck-engineering.com"
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-2 hover:text-gray-300"
        >
          <img src="/glueck-engineering-logo.png" alt="Glück Engineering" className="h-4 w-4" />
          Erstellt von &copy; Glück Engineering
        </a>
      </div>
    </footer>
  );
}
