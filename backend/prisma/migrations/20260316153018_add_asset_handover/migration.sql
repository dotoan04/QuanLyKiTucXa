-- CreateTable
CREATE TABLE "asset_handovers" (
    "id" UUID NOT NULL,
    "contract_id" UUID NOT NULL,
    "items" JSONB NOT NULL,
    "handover_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "confirmed_by" UUID,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "asset_handovers_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "asset_handovers_contract_id_key" ON "asset_handovers"("contract_id");

-- AddForeignKey
ALTER TABLE "asset_handovers" ADD CONSTRAINT "asset_handovers_contract_id_fkey" FOREIGN KEY ("contract_id") REFERENCES "contracts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "asset_handovers" ADD CONSTRAINT "asset_handovers_confirmed_by_fkey" FOREIGN KEY ("confirmed_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
