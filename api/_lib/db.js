import { PrismaClient } from "@prisma/client";

// Serverless functions can be invoked repeatedly in the same process;
// reuse a single PrismaClient instance to avoid exhausting DB connections.
const globalForPrisma = globalThis;

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

export function parseCapacity(value) {
  return value !== undefined && value !== null && value !== "" ? Number(value) : null;
}

export function isRegistrationOpen(event) {
  if (event.comingSoon) return false;
  if (!event.isOpen) return false;
  if (event.registrationDeadline && new Date() > new Date(event.registrationDeadline)) return false;
  return true;
}

export function isEarlyAccessUnlocked(event, password) {
  if (!event.earlyAccessEnabled) return true;
  return Boolean(password) && password === event.earlyAccessPassword;
}

export function withRemainingSeats(event, { password } = {}) {
  const unlocked = isEarlyAccessUnlocked(event, password);

  if (event.earlyAccessEnabled && !unlocked) {
    return {
      id: event.id,
      slug: event.slug,
      title: event.title,
      imageUrl: event.imageUrl,
      comingSoon: false,
      earlyAccessEnabled: true,
      locked: true,
      isExternal: event.isExternal,
      externalOrganizer: event.externalOrganizer,
      externalContactEmail: event.externalContactEmail,
    };
  }

  return {
    id: event.id,
    slug: event.slug,
    title: event.title,
    description: event.description,
    imageUrl: event.imageUrl,
    eventDate: event.eventDate,
    comingSoon: event.comingSoon,
    registrationDeadline: event.registrationDeadline,
    pricePerPerson: event.pricePerPerson,
    paypalLink: event.paypalLink,
    paymentNote: event.paymentNote,
    isOpen: event.isOpen,
    earlyAccessEnabled: event.earlyAccessEnabled,
    isExternal: event.isExternal,
    externalOrganizer: event.externalOrganizer,
    externalContactEmail: event.externalContactEmail,
    locked: false,
    registrationOpen: isRegistrationOpen(event),
    buses: event.buses.map((bus) => {
      const paidCount = bus.registrations.filter((r) => r.paid).length;
      return {
        id: bus.id,
        name: bus.name,
        capacity: bus.capacity,
        enabled: bus.enabled,
        remaining: bus.capacity === null ? null : Math.max(0, bus.capacity - paidCount),
      };
    }),
  };
}
