-- CreateEnum
CREATE TYPE "DocumentType" AS ENUM ('CITIZENSHIP_FRONT', 'CITIZENSHIP_BACK', 'PASSPORT', 'PAN_CARD', 'COMPANY_REGISTRATION', 'VAT_CERTIFICATE', 'TAX_CLEARANCE', 'BANK_STATEMENT', 'PROFILE_PHOTO', 'SIGNATURE', 'OTHER');

-- CreateEnum
CREATE TYPE "DocumentStatus" AS ENUM ('PENDING', 'VERIFIED', 'REJECTED');

-- AlterTable
ALTER TABLE "agents" ADD COLUMN     "bankAccountName" TEXT,
ADD COLUMN     "bankAccountNumber" TEXT,
ADD COLUMN     "bankBranch" TEXT,
ADD COLUMN     "bankName" TEXT,
ADD COLUMN     "businessType" TEXT,
ADD COLUMN     "commissionType" "MarkupType",
ADD COLUMN     "commissionValue" DECIMAL(15,2),
ADD COLUMN     "creditLimit" DECIMAL(15,2),
ADD COLUMN     "dateOfBirth" TIMESTAMP(3),
ADD COLUMN     "discountType" "MarkupType",
ADD COLUMN     "discountValue" DECIMAL(15,2),
ADD COLUMN     "emergencyContact" TEXT,
ADD COLUMN     "emergencyPhone" TEXT,
ADD COLUMN     "gender" TEXT,
ADD COLUMN     "markupType" "MarkupType",
ADD COLUMN     "markupValue" DECIMAL(15,2),
ADD COLUMN     "monthlyBookingVolume" TEXT,
ADD COLUMN     "numberOfEmployees" INTEGER,
ADD COLUMN     "panNumber" TEXT,
ADD COLUMN     "registrationNumber" TEXT,
ADD COLUMN     "secondaryEmail" TEXT,
ADD COLUMN     "secondaryPhone" TEXT,
ADD COLUMN     "taxVatNumber" TEXT,
ADD COLUMN     "websiteUrl" TEXT,
ADD COLUMN     "yearEstablished" INTEGER;

-- CreateTable
CREATE TABLE "agent_documents" (
    "id" TEXT NOT NULL,
    "agentId" TEXT NOT NULL,
    "documentType" "DocumentType" NOT NULL,
    "documentName" TEXT NOT NULL,
    "documentUrl" TEXT NOT NULL,
    "documentNumber" TEXT,
    "issuedDate" TIMESTAMP(3),
    "expiryDate" TIMESTAMP(3),
    "verificationStatus" "DocumentStatus" NOT NULL DEFAULT 'PENDING',
    "verifiedBy" TEXT,
    "verifiedAt" TIMESTAMP(3),
    "rejectionReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "agent_documents_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "agent_documents_agentId_idx" ON "agent_documents"("agentId");

-- CreateIndex
CREATE INDEX "agent_documents_documentType_idx" ON "agent_documents"("documentType");

-- CreateIndex
CREATE INDEX "agent_documents_verificationStatus_idx" ON "agent_documents"("verificationStatus");

-- AddForeignKey
ALTER TABLE "agent_documents" ADD CONSTRAINT "agent_documents_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "agents"("id") ON DELETE CASCADE ON UPDATE CASCADE;
