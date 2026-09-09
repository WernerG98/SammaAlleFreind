-- DropIndex
DROP INDEX "Registration_eventId_email_key";

-- AlterTable
ALTER TABLE "Registration" ADD COLUMN     "groupId" TEXT;

-- CreateIndex
CREATE INDEX "Registration_eventId_email_idx" ON "Registration"("eventId", "email");

-- CreateIndex
CREATE INDEX "Registration_groupId_idx" ON "Registration"("groupId");
