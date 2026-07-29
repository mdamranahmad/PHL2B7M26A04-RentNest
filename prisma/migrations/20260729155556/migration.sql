/*
  Warnings:

  - Changed the type of `currentPeriodEnd` on the `Subscription` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- DropIndex
DROP INDEX "Subscription_currentPeriodEnd_key";

-- AlterTable
ALTER TABLE "Subscription" DROP COLUMN "currentPeriodEnd",
ADD COLUMN     "currentPeriodEnd" TIMESTAMP(3) NOT NULL;
