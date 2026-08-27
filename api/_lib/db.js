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

export function isRegistrationOpen(event) {
  if (!event.isOpen) return false;
  if (event.registrationDeadline && new Date() > new Date(event.registrationDeadline)) return false;
  return true;
}

export function withRemainingSeats(event) {
  return {
    ...event,
    registrationOpen: isRegistrationOpen(event),
    buses: event.buses.map((bus) => {
      const paidCount = bus.registrations.filter((r) => r.paid).length;
      return {
        id: bus.id,
        name: bus.name,
        capacity: bus.capacity,
        remaining: Math.max(0, bus.capacity - paidCount),
      };
    }),
  };
}
