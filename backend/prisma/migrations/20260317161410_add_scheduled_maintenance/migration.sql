-- CreateEnum
CREATE TYPE "MaintenanceType" AS ENUM ('preventive', 'corrective', 'inspection', 'emergency');

-- CreateEnum
CREATE TYPE "MaintenanceStatus" AS ENUM ('scheduled', 'in_progress', 'completed', 'cancelled');

-- CreateTable
CREATE TABLE "scheduled_maintenance" (
    "id" UUID NOT NULL,
    "title" VARCHAR(200) NOT NULL,
    "description" TEXT,
    "type" "MaintenanceType" NOT NULL,
    "status" "MaintenanceStatus" NOT NULL DEFAULT 'scheduled',
    "room_id" UUID,
    "area" VARCHAR(100),
    "scheduled_at" TIMESTAMP(3) NOT NULL,
    "completed_at" TIMESTAMP(3),
    "assignee_id" UUID,
    "cost" DECIMAL(12,2),
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "scheduled_maintenance_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "scheduled_maintenance_room_id_idx" ON "scheduled_maintenance"("room_id");

-- CreateIndex
CREATE INDEX "scheduled_maintenance_status_idx" ON "scheduled_maintenance"("status");

-- CreateIndex
CREATE INDEX "scheduled_maintenance_scheduled_at_idx" ON "scheduled_maintenance"("scheduled_at");

-- AddForeignKey
ALTER TABLE "scheduled_maintenance" ADD CONSTRAINT "scheduled_maintenance_room_id_fkey" FOREIGN KEY ("room_id") REFERENCES "rooms"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "scheduled_maintenance" ADD CONSTRAINT "scheduled_maintenance_assignee_id_fkey" FOREIGN KEY ("assignee_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
