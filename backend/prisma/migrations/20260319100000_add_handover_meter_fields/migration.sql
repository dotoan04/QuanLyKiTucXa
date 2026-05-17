-- AlterTable: Add meter reading fields and completion tracking to AssetHandover
ALTER TABLE "asset_handovers" ADD COLUMN "electricity_initial" DECIMAL(10,2);
ALTER TABLE "asset_handovers" ADD COLUMN "water_initial" DECIMAL(10,2);
ALTER TABLE "asset_handovers" ADD COLUMN "electricity_photo" TEXT;
ALTER TABLE "asset_handovers" ADD COLUMN "water_photo" TEXT;
ALTER TABLE "asset_handovers" ADD COLUMN "room_photos" TEXT[];
ALTER TABLE "asset_handovers" ADD COLUMN "completed_at" TIMESTAMP(3);
ALTER TABLE "asset_handovers" ADD COLUMN "completed_by" UUID;

-- AddForeignKey
ALTER TABLE "asset_handovers" ADD CONSTRAINT "asset_handovers_completed_by_fkey" FOREIGN KEY ("completed_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
