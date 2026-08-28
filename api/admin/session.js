import bcrypt from "bcryptjs";
import { createSessionCookie, clearSessionCookie, getAdminSession } from "../_lib/auth.js";

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

    const account = accounts.find((a) => a.username === username);
    if (!account) {
      return res.status(401).json({ error: "Benutzername oder Passwort falsch." });
    }

    const valid = await bcrypt.compare(password || "", account.hash);
    if (!valid) {
      return res.status(401).json({ error: "Benutzername oder Passwort falsch." });
    }

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
