-- AlterTable
ALTER TABLE "Event" ADD COLUMN     "isPrivate" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "privatePassword" TEXT;
