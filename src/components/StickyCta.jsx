import { useEffect, useState } from "react";

// Fester Button am unteren Rand (nur Handy), der zum Formular springt.
// Verschwindet, sobald das Formular selbst im Bild ist.
export default function StickyCta({ targetId, label }) {
  const [targetVisible, setTargetVisible] = useState(false);

  useEffect(() => {
    function update() {
      const target = document.getElementById(targetId);
      if (!target) return;
      setTargetVisible(target.getBoundingClientRect().top < window.innerHeight - 80);
    }
    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, [targetId]);

  if (targetVisible) return null;

  return (
    <div className="md:hidden fixed inset-x-0 bottom-0 z-40 border-t border-gray-800 bg-gray-950/90 backdrop-blur-md px-3 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
      <button
        type="button"
        onClick={() => document.getElementById(targetId)?.scrollIntoView({ behavior: "smooth", block: "start" })}
        className="w-full rounded-lg bg-gradient-to-r from-teal-500 to-emerald-500 py-3 text-base font-semibold text-white shadow-md shadow-teal-950/40 active:scale-[0.98] transition-transform"
      >
        {label}
      </button>
    </div>
  );
}
