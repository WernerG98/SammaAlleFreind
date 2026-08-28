import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "../../lib/api.js";

export default function LoginPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ username: "", password: "" });
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      await api.post("/admin/session", form);
      navigate("/admin");
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-950">
      <form onSubmit={handleSubmit} className="bg-gray-900 border border-gray-800 rounded-lg p-8 w-full max-w-sm space-y-4">
        <Link to="/" className="inline-block text-sm text-teal-400 hover:text-teal-300">
          ← Zurück zur Startseite
        </Link>
        <h1 className="text-xl font-bold text-gray-100">Admin-Login</h1>
        <div>
          <label className="block text-sm font-medium mb-1 text-gray-300">Benutzername</label>
          <input
            required
            className="w-full border border-gray-700 bg-gray-800 text-gray-100 rounded px-3 py-2 focus:outline-none focus:border-teal-500"
            value={form.username}
            onChange={(e) => setForm({ ...form, username: e.target.value })}
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1 text-gray-300">Passwort</label>
          <input
            required
            type="password"
            className="w-full border border-gray-700 bg-gray-800 text-gray-100 rounded px-3 py-2 focus:outline-none focus:border-teal-500"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
          />
        </div>
        {error && <p className="text-sm text-red-400">{error}</p>}
        <button
          type="submit"
          disabled={submitting}
          className="w-full bg-teal-600 hover:bg-teal-500 text-white rounded py-2 font-medium disabled:opacity-50 transition-colors"
        >
          Anmelden
        </button>
      </form>
    </div>
  );
}
