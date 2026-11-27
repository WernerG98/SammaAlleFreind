-- AlterTable
ALTER TABLE "EventInterest" ADD COLUMN     "offerStatus" TEXT,
ADD COLUMN     "offerToken" TEXT,
ADD COLUMN     "offeredAt" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "SeatRelease" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "busId" TEXT NOT NULL,
    "releasedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "offeredInterestId" TEXT,
    "closedAt" TIMESTAMP(3),
    "closedReason" TEXT,

    CONSTRAINT "SeatRelease_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "SeatRelease_closedAt_releasedAt_idx" ON "SeatRelease"("closedAt", "releasedAt");

-- CreateIndex
CREATE UNIQUE INDEX "EventInterest_offerToken_key" ON "EventInterest"("offerToken");

-- AddForeignKey
ALTER TABLE "SeatRelease" ADD CONSTRAINT "SeatRelease_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;

