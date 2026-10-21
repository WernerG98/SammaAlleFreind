const HOUR = 3600000;
const DAY = 24 * HOUR;
const HINT_WITHIN_DAYS = 7;

export function formatDeadlineHint(deadline) {
  if (!deadline) return null;
  const remaining = new Date(deadline).getTime() - Date.now();
  if (remaining <= 0 || remaining > HINT_WITHIN_DAYS * DAY) return null;

  if (remaining < DAY) {
    const hours = Math.max(1, Math.ceil(remaining / HOUR));
    return { text: `Anmeldeschluss in ${hours} Stunde${hours === 1 ? "" : "n"}`, urgent: true };
  }
  const days = Math.ceil(remaining / DAY);
  return { text: `Anmeldeschluss in ${days} Tagen`, urgent: days <= 2 };
}
