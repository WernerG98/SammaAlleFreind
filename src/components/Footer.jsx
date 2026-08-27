import { Link } from "react-router-dom";

export default function Footer() {
  return (
    <footer className="mt-16 border-t py-6 text-center text-xs text-gray-400">
      <Link to="/admin/login" className="hover:text-gray-600">
        Admin-Login
      </Link>
      <div className="mt-2">
        <a
          href="https://glueck-engineering.com"
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-2 hover:text-gray-600"
        >
          <img src="/glueck-engineering-logo.png" alt="Glück Engineering" className="h-4 w-4" />
          Erstellt von &copy; Glück Engineering
        </a>
      </div>
    </footer>
  );
}
