import { Link } from "react-router-dom";

const linkClass = "inline-block px-2 py-2 hover:text-gray-300";

export default function Footer() {
  return (
    <footer className="mt-16 border-t border-gray-800 py-4 text-center text-xs text-gray-500">
      <div className="flex flex-wrap items-center justify-center gap-x-1">
        <Link to="/impressum" className={linkClass}>
          Impressum
        </Link>
        <span aria-hidden="true">·</span>
        <Link to="/datenschutz" className={linkClass}>
          Datenschutz
        </Link>
        <span aria-hidden="true">·</span>
        <Link to="/admin/login" className={linkClass}>
          Admin-Login
        </Link>
      </div>
      <div>
        <a
          href="https://glueck-engineering.com"
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-2 px-2 py-2 hover:text-gray-300"
        >
          <img src="/glueck-engineering-logo.png" alt="Glück Engineering" className="h-4 w-4" />
          Erstellt von &copy; Glück Engineering
        </a>
      </div>
    </footer>
  );
}
