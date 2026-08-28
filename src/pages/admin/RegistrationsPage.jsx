import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { api } from "../../lib/api.js";
import ConfirmDialog from "../../components/ConfirmDialog.jsx";

function BulkEmailForm({ eventId }) {
  const [target, setTarget] = useState("paid");
  const [subject, setSubject] = useState("");
  const [bodyHtml, setBodyHtml] = useState("");
  const [status, setStatus] = useState("idle");
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setResult(null);
    setStatus("submitting");
    try {
      const res = await api.post("/admin/events", { action: "send-email", eventId, target, subject, bodyHtml });
      setResult(res);
      setStatus("done");
    } catch (err) {
      setError(err.message);
      setStatus("idle");
    }
  }

  return (
    <div className="mt-8 bg-gray-900 border border-gray-800 rounded-lg p-5">
      <h2 className="font-semibold mb-3 text-gray-100">E-Mail an Teilnehmer senden</h2>
      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="flex gap-4 text-sm text-gray-300">
          <label className="flex items-center gap-2">
            <input type="radio" checked={target === "paid"} onChange={() => setTarget("paid")} />
            Fix dabei (bezahlt)
          </label>
          <label className="flex items-center gap-2">
            <input type="radio" checked={target === "unpaid"} onChange={() => setTarget("unpaid")} />
            Noch nicht bezahlt
          </label>
        </div>
        <input
          required
          placeholder="Betreff"
          className="w-full border border-gray-700 bg-gray-800 text-gray-100 placeholder-gray-500 rounded px-3 py-2 text-sm focus:outline-none focus:border-teal-500"
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
        />
        <textarea
          required
          rows={5}
          placeholder="Inhalt (HTML wird unterstützt)"
          className="w-full border border-gray-700 bg-gray-800 text-gray-100 placeholder-gray-500 rounded px-3 py-2 text-sm font-mono focus:outline-none focus:border-teal-500"
          value={bodyHtml}
          onChange={(e) => setBodyHtml(e.target.value)}
        />

        {error && <p className="text-sm text-red-400">{error}</p>}
        {result && (
          <p className="text-sm text-emerald-400">
            Versendet an {result.sent} von {result.total} Personen.
            {result.failed.length > 0 && ` Fehlgeschlagen: ${result.failed.join(", ")}`}
          </p>
        )}

        <button
          type="submit"
          disabled={status === "submitting"}
          className="bg-teal-600 hover:bg-teal-500 text-white rounded px-4 py-2 text-sm font-medium disabled:opacity-50 transition-colors"
        >
          {status === "submitting" ? "Wird gesendet…" : "Senden"}
        </button>
      </form>
    </div>
  );
}

export default function RegistrationsPage() {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [buses, setBuses] = useState([]);
  const [error, setError] = useState("");
  const [pendingId, setPendingId] = useState(null);
  const [toRemove, setToRemove] = useState(null);
  const [bulkRemoveStep, setBulkRemoveStep] = useState(0);
  const [bulkRemoving, setBulkRemoving] = useState(false);
  const [busFilter, setBusFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [sortField, setSortField] = useState("name");
  const [sortDir, setSortDir] = useState("asc");

  function load() {
    api
      .get(`/admin/registrations?eventId=${id}`)
      .then(setData)
      .catch((err) => setError(err.message));
    api
      .get(`/admin/events/${id}`)
      .then((event) => setBuses(event.buses))
      .catch(() => {});
  }

  useEffect(load, [id]);

  const registrations = data?.registrations || [];
  const interests = data?.interests || [];

  const busStats = useMemo(() => {
    return buses.map((bus) => {
      const paidCount = registrations.filter((r) => r.busId === bus.id && r.paid).length;
      return { ...bus, paidCount, full: bus.capacity !== null && paidCount >= bus.capacity };
    });
  }, [buses, registrations]);

  function sortValue(reg, field) {
    switch (field) {
      case "name":
        return `${reg.firstName} ${reg.lastName}`.toLowerCase();
      case "email":
        return reg.email.toLowerCase();
      case "bus":
        return reg.bus?.name?.toLowerCase() || "";
      case "newsletter":
        return reg.newsletterOptIn ? 1 : 0;
      case "paid":
        return reg.paid ? 1 : 0;
      default:
        return "";
    }
  }

  function toggleSort(field) {
    if (sortField === field) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDir("asc");
    }
  }

  function SortHeader({ field, children }) {
    const active = sortField === field;
    return (
      <th className="px-4 py-2">
        <button
          type="button"
          onClick={() => toggleSort(field)}
          className={`flex items-center gap-1 font-semibold ${active ? "text-gray-100" : "text-gray-500"}`}
        >
          {children}
          <span className="text-xs">{active ? (sortDir === "asc" ? "▲" : "▼") : "↕"}</span>
        </button>
      </th>
    );
  }

  const filteredRegistrations = registrations
    .filter((r) => busFilter === "all" || r.busId === busFilter)
    .filter((r) => {
      if (!search.trim()) return true;
      const q = search.trim().toLowerCase();
      return `${r.firstName} ${r.lastName}`.toLowerCase().includes(q) || r.email.toLowerCase().includes(q);
    })
    .sort((a, b) => {
      const va = sortValue(a, sortField);
      const vb = sortValue(b, sortField);
      const cmp = va < vb ? -1 : va > vb ? 1 : 0;
      return sortDir === "asc" ? cmp : -cmp;
    });

  async function togglePaid(reg) {
    setError("");
    setPendingId(reg.id);
    try {
      await api.post(`/admin/registrations/${reg.id}`, { paid: !reg.paid });
      load();
    } catch (err) {
      setError(err.message);
    } finally {
      setPendingId(null);
    }
  }

  async function changeBus(reg, newBusId) {
    if (newBusId === reg.busId) return;
    setError("");
    setPendingId(reg.id);
    try {
      await api.post(`/admin/registrations/${reg.id}`, { busId: newBusId });
      load();
    } catch (err) {
      setError(err.message);
    } finally {
      setPendingId(null);
    }
  }

  function exportCsv() {
    const headers = ["Vorname", "Name", "E-Mail", "Slot", "Newsletter", "Bezahlt", "Angemeldet am"];
    const rows = filteredRegistrations.map((r) => [
      r.firstName,
      r.lastName,
      r.email,
      r.bus?.name || "",
      r.newsletterOptIn ? "Ja" : "Nein",
      r.paid ? "Ja" : "Nein",
      new Date(r.createdAt).toLocaleDateString("de-DE"),
    ]);
    const escapeCell = (val) => `"${String(val).replace(/"/g, '""')}"`;
    const csv = [headers, ...rows].map((row) => row.map(escapeCell).join(";")).join("\r\n");
    const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `anmeldungen-${id}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  async function confirmRemove() {
    if (!toRemove) return;
    setError("");
    setPendingId(toRemove.id);
    try {
      await api.delete(`/admin/registrations/${toRemove.id}`);
      setToRemove(null);
      load();
    } catch (err) {
      setError(err.message);
    } finally {
      setPendingId(null);
    }
  }

  async function confirmBulkRemove() {
    setError("");
    setBulkRemoving(true);
    try {
      await api.delete(`/admin/registrations?eventId=${id}`);
      setBulkRemoveStep(0);
      load();
    } catch (err) {
      setError(err.message);
    } finally {
      setBulkRemoving(false);
    }
  }

  return (
    <div>
      <Link to="/admin" className="text-sm text-teal-400 hover:underline">
        ← Zurück zur Übersicht
      </Link>
      <h1 className="text-2xl font-bold mt-2 mb-6 text-gray-100">Anmeldungen</h1>

      {error && <p className="text-red-400 mb-4">{error}</p>}

      {buses.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-4">
          <button
            type="button"
            onClick={() => setBusFilter("all")}
            className={`text-xs px-3 py-1.5 rounded-full border ${
              busFilter === "all"
                ? "bg-teal-600 text-white border-teal-600"
                : "bg-gray-900 text-gray-300 border-gray-700"
            }`}
          >
            Alle
          </button>
          {busStats.map((bus) => (
            <button
              type="button"
              key={bus.id}
              onClick={() => setBusFilter(bus.id)}
              className={`text-xs px-3 py-1.5 rounded-full border flex items-center gap-1 ${
                busFilter === bus.id
                  ? "bg-teal-600 text-white border-teal-600"
                  : bus.full || !bus.enabled
                    ? "bg-gray-800 text-gray-500 border-gray-700"
                    : "bg-gray-900 text-gray-300 border-gray-700"
              }`}
            >
              {(bus.full || !bus.enabled) && <span aria-hidden="true">{bus.enabled ? "🔒" : "⏳"}</span>}
              {bus.name} ({bus.paidCount}/{bus.capacity ?? "∞"})
            </button>
          ))}
        </div>
      )}

      <div className="flex flex-wrap items-center gap-2 mb-4">
        <input
          type="text"
          placeholder="Suche nach Name oder E-Mail…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full sm:w-72 border border-gray-700 bg-gray-900 text-gray-100 placeholder-gray-500 rounded px-3 py-2 text-sm focus:outline-none focus:border-teal-500"
        />
        <button
          type="button"
          onClick={exportCsv}
          disabled={filteredRegistrations.length === 0}
          className="border border-gray-700 rounded px-3 py-2 text-sm text-gray-300 hover:bg-gray-800 disabled:opacity-50 whitespace-nowrap"
        >
          ⬇️ CSV exportieren
        </button>
        <button
          type="button"
          onClick={() => setBulkRemoveStep(1)}
          disabled={registrations.length === 0}
          className="border border-red-800 rounded px-3 py-2 text-sm text-red-400 hover:bg-red-950/40 disabled:opacity-50 whitespace-nowrap"
        >
          🗑️ Alle Anmeldungen entfernen
        </button>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-lg overflow-x-auto">
        <table className="w-full text-sm min-w-[640px]">
          <thead className="bg-gray-800 text-left">
            <tr>
              <SortHeader field="name">Name</SortHeader>
              <SortHeader field="email">E-Mail</SortHeader>
              <SortHeader field="bus">Slot</SortHeader>
              <SortHeader field="newsletter">Newsletter</SortHeader>
              <SortHeader field="paid">Bezahlt</SortHeader>
              <th className="px-4 py-2"></th>
            </tr>
          </thead>
          <tbody>
            {filteredRegistrations.map((reg) => (
              <tr key={reg.id} className="border-t border-gray-800 text-gray-200">
                <td className="px-4 py-2">
                  {reg.firstName} {reg.lastName}
                </td>
                <td className="px-4 py-2">{reg.email}</td>
                <td className="px-4 py-2">
                  <select
                    className="border border-gray-700 bg-gray-800 text-gray-100 rounded px-2 py-1 text-xs focus:outline-none focus:border-teal-500"
                    value={reg.busId}
                    disabled={pendingId === reg.id}
                    onChange={(e) => changeBus(reg, e.target.value)}
                  >
                    {buses.map((bus) => (
                      <option key={bus.id} value={bus.id}>
                        {bus.name}
                      </option>
                    ))}
                  </select>
                </td>
                <td className="px-4 py-2">{reg.newsletterOptIn ? "Ja" : "Nein"}</td>
                <td className="px-4 py-2">
                  <input
                    type="checkbox"
                    checked={reg.paid}
                    disabled={pendingId === reg.id}
                    onChange={() => togglePaid(reg)}
                  />
                </td>
                <td className="px-4 py-2 text-right">
                  <button
                    type="button"
                    disabled={pendingId === reg.id}
                    onClick={() => setToRemove({ id: reg.id, label: `${reg.firstName} ${reg.lastName}` })}
                    className="text-red-400 hover:underline text-xs"
                  >
                    Entfernen
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filteredRegistrations.length === 0 && (
          <p className="text-gray-500 px-4 py-6">Keine Anmeldungen in dieser Auswahl.</p>
        )}
      </div>

      {interests.length > 0 && (
        <div className="mt-8">
          <h2 className="font-semibold mb-3 text-gray-100">Interessenten (Coming Soon)</h2>
          <div className="bg-gray-900 border border-gray-800 rounded-lg overflow-x-auto">
            <table className="w-full text-sm min-w-[420px]">
              <thead className="bg-gray-800 text-left">
                <tr>
                  <th className="px-4 py-2 text-gray-300">Name</th>
                  <th className="px-4 py-2 text-gray-300">E-Mail</th>
                  <th className="px-4 py-2"></th>
                </tr>
              </thead>
              <tbody>
                {interests.map((int) => (
                  <tr key={int.id} className="border-t border-gray-800 text-gray-200">
                    <td className="px-4 py-2">
                      {int.firstName} {int.lastName}
                    </td>
                    <td className="px-4 py-2">{int.email}</td>
                    <td className="px-4 py-2 text-right">
                      <button
                        type="button"
                        disabled={pendingId === int.id}
                        onClick={() => setToRemove({ id: int.id, label: `${int.firstName} ${int.lastName}` })}
                        className="text-red-400 hover:underline text-xs"
                      >
                        Entfernen
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {registrations.length > 0 && <BulkEmailForm eventId={id} />}

      <ConfirmDialog
        open={!!toRemove}
        title="Person entfernen?"
        message={`${toRemove?.label} wird entfernt und erhält eine Info-E-Mail darüber. Das kann nicht rückgängig gemacht werden.`}
        onConfirm={confirmRemove}
        onCancel={() => setToRemove(null)}
      />

      <ConfirmDialog
        open={bulkRemoveStep === 1}
        title="Wirklich ALLE Anmeldungen entfernen?"
        message={`Alle ${registrations.length} Anmeldungen für diese Veranstaltung werden entfernt, jede Person erhält eine Info-E-Mail darüber.`}
        confirmLabel="Weiter"
        onConfirm={() => setBulkRemoveStep(2)}
        onCancel={() => setBulkRemoveStep(0)}
      />

      <ConfirmDialog
        open={bulkRemoveStep === 2}
        title="Bist du dir wirklich sicher?"
        message="Das kann nicht rückgängig gemacht werden. Alle Anmeldungen für diese Veranstaltung werden endgültig gelöscht."
        confirmLabel={bulkRemoving ? "Wird entfernt…" : "Endgültig entfernen"}
        confirmDisabled={bulkRemoving}
        onConfirm={confirmBulkRemove}
        onCancel={() => setBulkRemoveStep(0)}
      />
    </div>
  );
}
