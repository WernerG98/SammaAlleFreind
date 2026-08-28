-- AlterTable
ALTER TABLE "Event" ADD COLUMN     "earlyAccessEnabled" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "earlyAccessPassword" TEXT;
