import { getAdminSession } from "../_lib/auth.js";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Methode nicht erlaubt." });
  }

  const session = await getAdminSession(req);
  if (!session) {
    return res.status(401).json({ error: "Nicht angemeldet." });
  }

  return res.status(200).json({ username: session.username });
}
