-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "NotificationType" ADD VALUE 'deposit_confirmed';
ALTER TYPE "NotificationType" ADD VALUE 'deposit_rejected';
ALTER TYPE "NotificationType" ADD VALUE 'deposit_submitted';

-- AlterEnum
ALTER TYPE "RegistrationStatus" ADD VALUE 'deposit_confirmed';

-- AlterTable
ALTER TABLE "registration_requests" ADD COLUMN     "deposit_confirmed_at" TIMESTAMP(3),
ADD COLUMN     "deposit_confirmed_by" UUID,
ADD COLUMN     "deposit_reject_reason" TEXT;

-- AddForeignKey
ALTER TABLE "registration_requests" ADD CONSTRAINT "registration_requests_deposit_confirmed_by_fkey" FOREIGN KEY ("deposit_confirmed_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
