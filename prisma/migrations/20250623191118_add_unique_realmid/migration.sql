/*
  Warnings:

  - A unique constraint covering the columns `[realmId]` on the table `quickbooks_tokens` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "quickbooks_tokens_realmId_key" ON "quickbooks_tokens"("realmId");
