/*
  Warnings:

  - The primary key for the `Company` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The `id` column on the `Company` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The primary key for the `Creator` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The `id` column on the `Creator` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The primary key for the `Deal` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `invoiceNumber` on the `Deal` table. All the data in the column will be lost.
  - You are about to drop the column `kickoffDate` on the `Deal` table. All the data in the column will be lost.
  - You are about to drop the column `paymentMethod` on the `Deal` table. All the data in the column will be lost.
  - You are about to drop the column `pipedriveId` on the `Deal` table. All the data in the column will be lost.
  - You are about to drop the column `transactionLink` on the `Deal` table. All the data in the column will be lost.
  - The `id` column on the `Deal` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The primary key for the `Deliverable` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `dealId` on the `Deliverable` table. All the data in the column will be lost.
  - You are about to drop the column `deliveryLink` on the `Deliverable` table. All the data in the column will be lost.
  - You are about to drop the column `dueDate` on the `Deliverable` table. All the data in the column will be lost.
  - You are about to drop the column `status` on the `Deliverable` table. All the data in the column will be lost.
  - The `id` column on the `Deliverable` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `creatorId` column on the `Deliverable` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The primary key for the `Proposal` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `discount` on the `Proposal` table. All the data in the column will be lost.
  - The `id` column on the `Proposal` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The primary key for the `ProposalItem` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `description` on the `ProposalItem` table. All the data in the column will be lost.
  - You are about to drop the column `name` on the `ProposalItem` table. All the data in the column will be lost.
  - You are about to drop the column `unitPrice` on the `ProposalItem` table. All the data in the column will be lost.
  - The `id` column on the `ProposalItem` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - Changed the type of `companyId` on the `Deal` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Added the required column `basePrice` to the `Deliverable` table without a default value. This is not possible if the table is not empty.
  - Changed the type of `dealId` on the `Proposal` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Added the required column `deliverableId` to the `ProposalItem` table without a default value. This is not possible if the table is not empty.
  - Added the required column `price` to the `ProposalItem` table without a default value. This is not possible if the table is not empty.
  - Changed the type of `proposalId` on the `ProposalItem` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- DropForeignKey
ALTER TABLE "Deal" DROP CONSTRAINT "Deal_companyId_fkey";

-- DropForeignKey
ALTER TABLE "Deliverable" DROP CONSTRAINT "Deliverable_creatorId_fkey";

-- DropForeignKey
ALTER TABLE "Deliverable" DROP CONSTRAINT "Deliverable_dealId_fkey";

-- DropForeignKey
ALTER TABLE "Proposal" DROP CONSTRAINT "Proposal_dealId_fkey";

-- DropForeignKey
ALTER TABLE "ProposalItem" DROP CONSTRAINT "ProposalItem_proposalId_fkey";

-- DropIndex
DROP INDEX "Deal_pipedriveId_key";

-- AlterTable
ALTER TABLE "Company" DROP CONSTRAINT "Company_pkey",
DROP COLUMN "id",
ADD COLUMN     "id" SERIAL NOT NULL,
ADD CONSTRAINT "Company_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "Creator" DROP CONSTRAINT "Creator_pkey",
DROP COLUMN "id",
ADD COLUMN     "id" SERIAL NOT NULL,
ADD CONSTRAINT "Creator_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "Deal" DROP CONSTRAINT "Deal_pkey",
DROP COLUMN "invoiceNumber",
DROP COLUMN "kickoffDate",
DROP COLUMN "paymentMethod",
DROP COLUMN "pipedriveId",
DROP COLUMN "transactionLink",
DROP COLUMN "id",
ADD COLUMN     "id" SERIAL NOT NULL,
DROP COLUMN "companyId",
ADD COLUMN     "companyId" INTEGER NOT NULL,
ADD CONSTRAINT "Deal_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "Deliverable" DROP CONSTRAINT "Deliverable_pkey",
DROP COLUMN "dealId",
DROP COLUMN "deliveryLink",
DROP COLUMN "dueDate",
DROP COLUMN "status",
ADD COLUMN     "basePrice" DOUBLE PRECISION NOT NULL,
DROP COLUMN "id",
ADD COLUMN     "id" SERIAL NOT NULL,
DROP COLUMN "creatorId",
ADD COLUMN     "creatorId" INTEGER,
ADD CONSTRAINT "Deliverable_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "Proposal" DROP CONSTRAINT "Proposal_pkey",
DROP COLUMN "discount",
DROP COLUMN "id",
ADD COLUMN     "id" SERIAL NOT NULL,
DROP COLUMN "dealId",
ADD COLUMN     "dealId" INTEGER NOT NULL,
ADD CONSTRAINT "Proposal_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "ProposalItem" DROP CONSTRAINT "ProposalItem_pkey",
DROP COLUMN "description",
DROP COLUMN "name",
DROP COLUMN "unitPrice",
ADD COLUMN     "deliverableId" INTEGER NOT NULL,
ADD COLUMN     "price" DOUBLE PRECISION NOT NULL,
DROP COLUMN "id",
ADD COLUMN     "id" SERIAL NOT NULL,
DROP COLUMN "proposalId",
ADD COLUMN     "proposalId" INTEGER NOT NULL,
ADD CONSTRAINT "ProposalItem_pkey" PRIMARY KEY ("id");

-- AddForeignKey
ALTER TABLE "Deal" ADD CONSTRAINT "Deal_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Proposal" ADD CONSTRAINT "Proposal_dealId_fkey" FOREIGN KEY ("dealId") REFERENCES "Deal"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProposalItem" ADD CONSTRAINT "ProposalItem_proposalId_fkey" FOREIGN KEY ("proposalId") REFERENCES "Proposal"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProposalItem" ADD CONSTRAINT "ProposalItem_deliverableId_fkey" FOREIGN KEY ("deliverableId") REFERENCES "Deliverable"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Deliverable" ADD CONSTRAINT "Deliverable_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "Creator"("id") ON DELETE SET NULL ON UPDATE CASCADE;
