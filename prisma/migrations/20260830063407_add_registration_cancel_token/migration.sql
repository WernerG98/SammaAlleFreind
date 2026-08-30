-- AlterTable
ALTER TABLE "Registration" ADD COLUMN "cancelToken" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Registration_cancelToken_key" ON "Registration"("cancelToken");
