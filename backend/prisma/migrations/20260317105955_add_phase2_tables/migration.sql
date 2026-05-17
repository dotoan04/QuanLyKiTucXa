-- AlterTable
ALTER TABLE "registration_requests" ADD COLUMN     "documents" JSONB,
ADD COLUMN     "priority_score" INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "temporary_leaves" (
    "id" UUID NOT NULL,
    "contract_id" UUID NOT NULL,
    "leave_date" TIMESTAMP(3) NOT NULL,
    "return_date" TIMESTAMP(3) NOT NULL,
    "reason" TEXT,
    "contact_phone" VARCHAR(20),
    "emergency_contact" JSONB,
    "status" TEXT NOT NULL DEFAULT 'active',
    "actual_return_date" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "temporary_leaves_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "violations" (
    "id" UUID NOT NULL,
    "student_id" UUID NOT NULL,
    "incident_id" UUID,
    "type" VARCHAR(100) NOT NULL,
    "description" TEXT NOT NULL,
    "evidence" JSONB,
    "penaltyLevel" TEXT NOT NULL DEFAULT 'low',
    "penalty_amount" DECIMAL(12,2),
    "penalty_applied" BOOLEAN NOT NULL DEFAULT false,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "notes" TEXT,
    "reported_by" UUID NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "violations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "room_transfers" (
    "id" UUID NOT NULL,
    "contract_id" UUID NOT NULL,
    "from_room_id" UUID NOT NULL,
    "to_room_id" UUID NOT NULL,
    "reason" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "reviewed_by" UUID,
    "reviewed_at" TIMESTAMP(3),
    "review_note" TEXT,
    "transfer_fee" DECIMAL(12,2),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "room_transfers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reconciliation_reports" (
    "id" UUID NOT NULL,
    "month" VARCHAR(7) NOT NULL,
    "payment_gateway" VARCHAR(50) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "data" JSONB,
    "processed_at" TIMESTAMP(3),
    "processed_by" UUID,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "reconciliation_reports_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "temporary_leaves_contract_id_idx" ON "temporary_leaves"("contract_id");

-- CreateIndex
CREATE INDEX "temporary_leaves_status_idx" ON "temporary_leaves"("status");

-- CreateIndex
CREATE INDEX "violations_student_id_idx" ON "violations"("student_id");

-- CreateIndex
CREATE INDEX "violations_status_idx" ON "violations"("status");

-- CreateIndex
CREATE INDEX "room_transfers_contract_id_idx" ON "room_transfers"("contract_id");

-- CreateIndex
CREATE INDEX "room_transfers_status_idx" ON "room_transfers"("status");

-- CreateIndex
CREATE UNIQUE INDEX "reconciliation_reports_month_payment_gateway_key" ON "reconciliation_reports"("month", "payment_gateway");

-- CreateIndex
CREATE INDEX "registration_requests_priority_score_idx" ON "registration_requests"("priority_score");

-- AddForeignKey
ALTER TABLE "temporary_leaves" ADD CONSTRAINT "temporary_leaves_contract_id_fkey" FOREIGN KEY ("contract_id") REFERENCES "contracts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "violations" ADD CONSTRAINT "violations_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "students"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "violations" ADD CONSTRAINT "violations_incident_id_fkey" FOREIGN KEY ("incident_id") REFERENCES "incidents"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "violations" ADD CONSTRAINT "violations_reported_by_fkey" FOREIGN KEY ("reported_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "room_transfers" ADD CONSTRAINT "room_transfers_contract_id_fkey" FOREIGN KEY ("contract_id") REFERENCES "contracts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "room_transfers" ADD CONSTRAINT "room_transfers_from_room_id_fkey" FOREIGN KEY ("from_room_id") REFERENCES "rooms"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "room_transfers" ADD CONSTRAINT "room_transfers_to_room_id_fkey" FOREIGN KEY ("to_room_id") REFERENCES "rooms"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "room_transfers" ADD CONSTRAINT "room_transfers_reviewed_by_fkey" FOREIGN KEY ("reviewed_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reconciliation_reports" ADD CONSTRAINT "reconciliation_reports_processed_by_fkey" FOREIGN KEY ("processed_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
