import { prisma } from "./db.js";

const WINDOW_MS = 15 * 60 * 1000;
const LOCK_MS = 15 * 60 * 1000;
const STALE_MS = 24 * 60 * 60 * 1000;

// Pro IP strenger als pro Benutzername: Wer den Benutzernamen kennt, soll den Admin
// nicht mit ein paar Fehlversuchen aussperren können.
export const IP_LIMIT = 5;
export const USER_LIMIT = 20;

export function getClientIp(req) {
  const forwarded = req.headers["x-forwarded-for"];
  const first = typeof forwarded === "string" ? forwarded.split(",")[0].trim() : "";
  return first || req.headers["x-real-ip"] || req.socket?.remoteAddress || "unknown";
}

export async function getLockMinutes(keys, db = prisma) {
  const locked = await db.loginAttempt.findMany({
    where: { key: { in: keys }, lockedUntil: { gt: new Date() } },
    select: { lockedUntil: true },
  });
  if (locked.length === 0) return 0;
  const until = Math.max(...locked.map((row) => row.lockedUntil.getTime()));
  return Math.max(1, Math.ceil((until - Date.now()) / 60000));
}

export async function recordFailure(entries, db = prisma) {
  const now = Date.now();
  for (const { key, limit } of entries) {
    const row = await db.loginAttempt.findUnique({ where: { key } });
    const windowExpired = !row || now - row.windowStart.getTime() > WINDOW_MS;
    const failures = windowExpired ? 1 : row.failures + 1;
    const data = {
      failures,
      windowStart: windowExpired ? new Date(now) : row.windowStart,
      lockedUntil: failures >= limit ? new Date(now + LOCK_MS) : null,
    };
    await db.loginAttempt.upsert({ where: { key }, create: { key, ...data }, update: data });
  }
  await db.loginAttempt.deleteMany({
    where: {
      windowStart: { lt: new Date(now - STALE_MS) },
      OR: [{ lockedUntil: null }, { lockedUntil: { lt: new Date(now) } }],
    },
  });
}

export async function clearFailures(keys, db = prisma) {
  await db.loginAttempt.deleteMany({ where: { key: { in: keys } } });
}
