-- AlterTable
ALTER TABLE "Event" ADD COLUMN     "interestListClosedAt" TIMESTAMP(3);

ALTER TABLE "Event" ADD COLUMN     "interestCountBonus" INTEGER NOT NULL DEFAULT 0;
