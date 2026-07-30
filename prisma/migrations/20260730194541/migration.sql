/*
  Warnings:

  - A unique constraint covering the columns `[customerId]` on the table `payments` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `customerId` to the `payments` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "payments" ADD COLUMN     "customerId" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "payments_customerId_key" ON "payments"("customerId");

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
