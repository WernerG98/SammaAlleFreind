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

export const EVENT_RETENTION_DAYS = 7;

export async function cleanupExpiredEvents() {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - EVENT_RETENTION_DAYS);
  await prisma.event.deleteMany({ where: { eventDate: { lt: cutoff } } });
}

export function isRegistrationOpen(event) {
  if (event.comingSoon) return false;
  if (event.noRegistrationRequired) return false;
  if (!event.isOpen) return false;
  if (event.registrationDeadline && new Date() > new Date(event.registrationDeadline)) return false;
  if (event.eventDate && new Date() > new Date(event.eventDate)) return false;
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
      eventDate: event.eventDate,
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
    noRegistrationRequired: event.noRegistrationRequired,
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
      // A seat is reserved the moment someone registers, not only once an
      // admin confirms payment - otherwise several people could all be told
      // "1 Platz frei" for the same last seat while payments are pending.
      const registeredCount = bus.registrations.length;
      return {
        id: bus.id,
        name: bus.name,
        capacity: bus.capacity,
        enabled: bus.enabled,
        remaining: bus.capacity === null ? null : Math.max(0, bus.capacity - registeredCount),
      };
    }),
  };
}
