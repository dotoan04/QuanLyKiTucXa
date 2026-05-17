-- CreateEnum
CREATE TYPE "MeterReadingStatus" AS ENUM ('draft', 'submitted', 'approved', 'rejected', 'remeasure');

-- CreateTable
CREATE TABLE "meter_readings" (
    "id" UUID NOT NULL,
    "room_id" UUID NOT NULL,
    "month" VARCHAR(7) NOT NULL,
    "electricity_old" DECIMAL(10,2) NOT NULL,
    "electricity_new" DECIMAL(10,2) NOT NULL,
    "water_old" DECIMAL(10,2) NOT NULL,
    "water_new" DECIMAL(10,2) NOT NULL,
    "electricity_photo" TEXT,
    "water_photo" TEXT,
    "is_anomaly" BOOLEAN NOT NULL DEFAULT false,
    "anomaly_note" TEXT,
    "unreadable" BOOLEAN NOT NULL DEFAULT false,
    "unreadable_reason" TEXT,
    "status" "MeterReadingStatus" NOT NULL DEFAULT 'draft',
    "recorded_by" UUID NOT NULL,
    "reviewed_by" UUID,
    "review_note" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "meter_readings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "meter_readings_month_idx" ON "meter_readings"("month");

-- CreateIndex
CREATE INDEX "meter_readings_status_idx" ON "meter_readings"("status");

-- CreateIndex
CREATE UNIQUE INDEX "meter_readings_room_id_month_key" ON "meter_readings"("room_id", "month");

-- AddForeignKey
ALTER TABLE "meter_readings" ADD CONSTRAINT "meter_readings_room_id_fkey" FOREIGN KEY ("room_id") REFERENCES "rooms"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "meter_readings" ADD CONSTRAINT "meter_readings_recorded_by_fkey" FOREIGN KEY ("recorded_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "meter_readings" ADD CONSTRAINT "meter_readings_reviewed_by_fkey" FOREIGN KEY ("reviewed_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
