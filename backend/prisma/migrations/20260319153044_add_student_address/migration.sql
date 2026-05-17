-- AlterTable
ALTER TABLE "students" ADD COLUMN     "address" VARCHAR(200);

-- AddForeignKey
ALTER TABLE "registration_requests" ADD CONSTRAINT "registration_requests_assigned_room_id_fkey" FOREIGN KEY ("assigned_room_id") REFERENCES "rooms"("id") ON DELETE SET NULL ON UPDATE CASCADE;
