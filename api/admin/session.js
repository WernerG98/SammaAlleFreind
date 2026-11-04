import bcrypt from "bcryptjs";
import { createSessionCookie, clearSessionCookie, getAdminSession } from "../_lib/auth.js";
import {
  IP_LIMIT,
  USER_LIMIT,
  clearFailures,
  getClientIp,
  getLockMinutes,
  recordFailure,
} from "../_lib/loginLimit.js";

// Wird nur verglichen, wenn der Benutzername unbekannt ist (gleiche Antwortzeit wie bei bekanntem Namen).
const DUMMY_HASH = "$2a$12$CeH56yEYs2gWKQ.Jab5lBuN4helFiCCLQZFb.uVZCYO/oe2c/E/Lq";

// Die Sperre darf den Login nie selbst lahmlegen: Wenn die Datenbank nicht antwortet,
// wird ohne Sperre weitergemacht (der Login selbst braucht die Datenbank nicht).
async function safely(task) {
  try {
    return await task();
  } catch (err) {
    console.error("Login-Sperre nicht verfügbar:", err.message);
    return null;
  }
}

export default async function handler(req, res) {
  if (req.method === "GET") {
    const session = await getAdminSession(req);
    if (!session) {
      return res.status(401).json({ error: "Nicht angemeldet." });
    }
    return res.status(200).json({ username: session.username, role: session.role || "admin" });
  }

  if (req.method === "POST") {
    const { username, password } = req.body || {};

    const accounts = [
      { username: process.env.ADMIN_USERNAME, hash: process.env.ADMIN_PASSWORD_HASH, role: "admin" },
      {
        username: process.env.EXTERNAL_ADMIN_USERNAME,
        hash: process.env.EXTERNAL_ADMIN_PASSWORD_HASH,
        role: "external",
      },
    ].filter((a) => a.username && a.hash);

    if (accounts.length === 0) {
      return res.status(500).json({ error: "Admin-Zugang ist serverseitig nicht konfiguriert." });
    }

    const ipKey = `ip:${getClientIp(req)}`;
    const userKey = `user:${String(username || "").trim().toLowerCase().slice(0, 64)}`;
    const failureEntries = [
      { key: ipKey, limit: IP_LIMIT },
      { key: userKey, limit: USER_LIMIT },
    ];

    const lockMinutes = await safely(() => getLockMinutes([ipKey, userKey]));
    if (lockMinutes) {
      return res.status(429).json({
        error: `Zu viele Fehlversuche. Bitte versuche es in ${lockMinutes} Minute${lockMinutes === 1 ? "" : "n"} erneut.`,
      });
    }

    const account = accounts.find((a) => a.username === username);
    const passwordMatches = await bcrypt.compare(password || "", account?.hash || DUMMY_HASH);
    const valid = Boolean(account) && passwordMatches;
    if (!valid) {
      await safely(() => recordFailure(failureEntries));
      return res.status(401).json({ error: "Benutzername oder Passwort falsch." });
    }

    await safely(() => clearFailures([ipKey, userKey]));

    const cookie = await createSessionCookie(username, account.role);
    res.setHeader("Set-Cookie", cookie);
    return res.status(200).json({ success: true, role: account.role });
  }

  if (req.method === "DELETE") {
    res.setHeader("Set-Cookie", clearSessionCookie());
    return res.status(200).json({ success: true });
  }

  return res.status(405).json({ error: "Methode nicht erlaubt." });
}
