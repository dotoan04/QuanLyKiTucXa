-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "RegistrationStatus" ADD VALUE 'deposit_pending';
ALTER TYPE "RegistrationStatus" ADD VALUE 'deposit_paid';

-- AlterTable
ALTER TABLE "registration_requests" ADD COLUMN     "assigned_room_id" UUID,
ADD COLUMN     "contract_notes" TEXT,
ADD COLUMN     "deposit_amount" DECIMAL(12,2),
ADD COLUMN     "desired_duration" INTEGER,
ADD COLUMN     "payment_proof_url" TEXT;
