/*
  Warnings:

  - A unique constraint covering the columns `[categoryType]` on the table `categories` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "categories_categoryType_key" ON "categories"("categoryType");
