-- AlterTable
ALTER TABLE "Event" ADD COLUMN     "commentsEnabled" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "Registration" ADD COLUMN     "comment" TEXT;
