-- CreateEnum
CREATE TYPE "SSRStatus" AS ENUM ('PENDING', 'CONFIRMED', 'CANCELLED', 'FAILED');

-- CreateTable
CREATE TABLE "ssrs" (
    "id" TEXT NOT NULL,
    "bookingId" TEXT NOT NULL,
    "passengerId" TEXT NOT NULL,
    "passengerName" TEXT NOT NULL,
    "seatSelections" JSONB,
    "seatTotalPrice" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "mealSelections" JSONB,
    "mealTotalPrice" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "baggageSelection" JSONB,
    "baggageTotalPrice" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "assistanceRequest" JSONB,
    "assistanceTotalPrice" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "totalPrice" DECIMAL(15,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'NPR',
    "status" "SSRStatus" NOT NULL DEFAULT 'PENDING',
    "confirmedAt" TIMESTAMP(3),
    "cancelledAt" TIMESTAMP(3),
    "cancellationReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ssrs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ssrs_bookingId_idx" ON "ssrs"("bookingId");

-- CreateIndex
CREATE INDEX "ssrs_passengerId_idx" ON "ssrs"("passengerId");

-- CreateIndex
CREATE INDEX "ssrs_status_idx" ON "ssrs"("status");

-- AddForeignKey
ALTER TABLE "ssrs" ADD CONSTRAINT "ssrs_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "bookings"("id") ON DELETE CASCADE ON UPDATE CASCADE;
