-- AlterTable
ALTER TABLE "carpool_plans" ADD COLUMN "share_token" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "carpool_plans_share_token_key" ON "carpool_plans"("share_token");
