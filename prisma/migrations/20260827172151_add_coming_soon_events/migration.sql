-- AlterTable
ALTER TABLE "Event" ADD COLUMN     "comingSoon" BOOLEAN NOT NULL DEFAULT false,
ALTER COLUMN "eventDate" DROP NOT NULL;
