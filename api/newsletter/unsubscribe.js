import { prisma } from "../_lib/db.js";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Methode nicht erlaubt." });
  }

  const { token } = req.query;
  if (!token) {
    return res.status(400).json({ error: "Kein Token angegeben." });
  }

  const subscriber = await prisma.newsletterSubscriber.findUnique({
    where: { unsubscribeToken: token },
  });

  if (!subscriber) {
    return res.status(404).json({ error: "Ungültiger oder bereits verwendeter Link." });
  }

  await prisma.newsletterSubscriber.delete({ where: { id: subscriber.id } });

  return res.status(200).json({ success: true });
}
