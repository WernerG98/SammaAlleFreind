import bcrypt from "bcryptjs";
import { createSessionCookie, clearSessionCookie, getAdminSession } from "../_lib/auth.js";

export default async function handler(req, res) {
  if (req.method === "GET") {
    const session = await getAdminSession(req);
    if (!session) {
      return res.status(401).json({ error: "Nicht angemeldet." });
    }
    return res.status(200).json({ username: session.username });
  }

  if (req.method === "POST") {
    const { username, password } = req.body || {};
    const adminUsername = process.env.ADMIN_USERNAME;
    const adminPasswordHash = process.env.ADMIN_PASSWORD_HASH;

    if (!adminUsername || !adminPasswordHash) {
      return res.status(500).json({ error: "Admin-Zugang ist serverseitig nicht konfiguriert." });
    }

    if (username !== adminUsername) {
      return res.status(401).json({ error: "Benutzername oder Passwort falsch." });
    }

    const valid = await bcrypt.compare(password || "", adminPasswordHash);
    if (!valid) {
      return res.status(401).json({ error: "Benutzername oder Passwort falsch." });
    }

    const cookie = await createSessionCookie(username);
    res.setHeader("Set-Cookie", cookie);
    return res.status(200).json({ success: true });
  }

  if (req.method === "DELETE") {
    res.setHeader("Set-Cookie", clearSessionCookie());
    return res.status(200).json({ success: true });
  }

  return res.status(405).json({ error: "Methode nicht erlaubt." });
}
