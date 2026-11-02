// Schmale Leiste mit der Zahl der Angemeldeten/Vorgemerkten, eigenständig neben Badge oder Formular.
export default function AttendeesStrip({ icon = "👥", className = "", children }) {
  return (
    <div
      className={`flex items-center gap-2 rounded-full border border-teal-800/70 bg-gradient-to-r from-teal-500/25 via-teal-500/10 to-transparent px-3 py-1.5 text-xs font-semibold text-teal-200 ${className}`}
    >
      <span aria-hidden="true">{icon}</span>
      <span>{children}</span>
    </div>
  );
}
