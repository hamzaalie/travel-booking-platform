-- AlterTable: Add missing 'notes' column to fund_requests
ALTER TABLE "fund_requests" ADD COLUMN "notes" TEXT;

-- AlterEnum: Add missing 'TOURISM_CERTIFICATE' value to DocumentType
ALTER TYPE "DocumentType" ADD VALUE 'TOURISM_CERTIFICATE';
