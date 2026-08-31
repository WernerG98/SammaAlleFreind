export default function CapacityBar({ capacity, remaining, className = "" }) {
  if (!capacity || capacity <= 0 || remaining === null || remaining === undefined) return null;

  const filledPercent = Math.min(100, Math.max(0, Math.round(((capacity - remaining) / capacity) * 100)));
  const color = remaining === 0 ? "bg-red-500" : filledPercent >= 80 ? "bg-amber-500" : "bg-teal-500";

  return (
    <div className={`h-1.5 w-full rounded-full bg-gray-800 overflow-hidden ${className}`}>
      <div className={`h-full rounded-full ${color} transition-all`} style={{ width: `${filledPercent}%` }} />
    </div>
  );
}
