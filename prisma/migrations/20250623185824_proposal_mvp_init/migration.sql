/*
  Warnings:

  - You are about to drop the `Company` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Creator` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Deal` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Deliverable` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Proposal` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `ProposalItem` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `QuickBooksToken` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "Deal" DROP CONSTRAINT "Deal_companyId_fkey";

-- DropForeignKey
ALTER TABLE "Deliverable" DROP CONSTRAINT "Deliverable_creatorId_fkey";

-- DropForeignKey
ALTER TABLE "Proposal" DROP CONSTRAINT "Proposal_dealId_fkey";

-- DropForeignKey
ALTER TABLE "ProposalItem" DROP CONSTRAINT "ProposalItem_deliverableId_fkey";

-- DropForeignKey
ALTER TABLE "ProposalItem" DROP CONSTRAINT "ProposalItem_proposalId_fkey";

-- DropForeignKey
ALTER TABLE "QuickBooksToken" DROP CONSTRAINT "QuickBooksToken_companyId_fkey";

-- DropTable
DROP TABLE "Company";

-- DropTable
DROP TABLE "Creator";

-- DropTable
DROP TABLE "Deal";

-- DropTable
DROP TABLE "Deliverable";

-- DropTable
DROP TABLE "Proposal";

-- DropTable
DROP TABLE "ProposalItem";

-- DropTable
DROP TABLE "QuickBooksToken";

-- CreateTable
CREATE TABLE "deliverables" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "primaryCreator" TEXT,
    "retailPrice" DECIMAL(10,2) NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "deliverables_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "proposals" (
    "id" SERIAL NOT NULL,
    "dealId" INTEGER NOT NULL,
    "totalAmount" DECIMAL(10,2) NOT NULL,
    "pipedriveNoteId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" TEXT,

    CONSTRAINT "proposals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "proposal_items" (
    "id" SERIAL NOT NULL,
    "proposalId" INTEGER NOT NULL,
    "deliverableId" INTEGER NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "retailPrice" DECIMAL(10,2) NOT NULL,
    "chargedPrice" DECIMAL(10,2) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "proposal_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "quickbooks_tokens" (
    "id" TEXT NOT NULL,
    "accessToken" TEXT NOT NULL,
    "refreshToken" TEXT NOT NULL,
    "realmId" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "quickbooks_tokens_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "proposal_items" ADD CONSTRAINT "proposal_items_proposalId_fkey" FOREIGN KEY ("proposalId") REFERENCES "proposals"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "proposal_items" ADD CONSTRAINT "proposal_items_deliverableId_fkey" FOREIGN KEY ("deliverableId") REFERENCES "deliverables"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
