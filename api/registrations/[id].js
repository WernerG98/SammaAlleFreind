import { prisma } from "../_lib/db.js";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Methode nicht erlaubt." });
  }

  const { id } = req.query;

  const registration = await prisma.registration.findUnique({
    where: { id },
    include: { event: true, bus: true },
  });

  if (!registration) {
    return res.status(404).json({ error: "Anmeldung nicht gefunden." });
  }

  return res.status(200).json({
    id: registration.id,
    firstName: registration.firstName,
    lastName: registration.lastName,
    paid: registration.paid,
    bus: { name: registration.bus.name },
    event: {
      title: registration.event.title,
      pricePerPerson: registration.event.pricePerPerson,
      paypalLink: registration.event.paypalLink,
      paymentNote: registration.event.paymentNote,
    },
  });
}
