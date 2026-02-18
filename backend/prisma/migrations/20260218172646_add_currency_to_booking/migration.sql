-- AlterTable
ALTER TABLE "bookings" ADD COLUMN "currency" TEXT NOT NULL DEFAULT 'USD';

-- Backfill existing bookings with currency from flightDetails JSON
UPDATE "bookings"
SET "currency" = COALESCE(
  "flightDetails"::jsonb -> 'price' ->> 'currency',
  'USD'
)
WHERE "flightDetails" IS NOT NULL;
