-- AlterTable
ALTER TABLE "Event" ADD COLUMN     "externalOrganizer" TEXT,
ADD COLUMN     "isExternal" BOOLEAN NOT NULL DEFAULT false;
