import { useToast } from "./Toast.jsx";

export default function CopyButton({ text, label = "Kopieren", className = "" }) {
  const toast = useToast();

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(text);
      toast("Kopiert!");
    } catch {
      toast("Kopieren fehlgeschlagen.", "error");
    }
  }

  return (
    <button
      type="button"
      onClick={handleCopy}
      aria-label={label ? `${label} kopieren` : "Kopieren"}
      className={`inline-flex items-center gap-1 text-gray-400 hover:text-teal-300 active:scale-90 transition-all ${className}`}
    >
      <span aria-hidden="true">📋</span>
      {label && <span className="text-xs">{label}</span>}
    </button>
  );
}
