-- AlterEnum
ALTER TYPE "AvailabilityStatus" ADD VALUE 'WAITING';

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "RentRequestStatus" ADD VALUE 'PAYMENT_PENDING';
ALTER TYPE "RentRequestStatus" ADD VALUE 'CANCELLED';
ALTER TYPE "RentRequestStatus" ADD VALUE 'RELEASED';
ALTER TYPE "RentRequestStatus" ADD VALUE 'EXPIRED';
ALTER TYPE "RentRequestStatus" ADD VALUE 'TERMINATED';
