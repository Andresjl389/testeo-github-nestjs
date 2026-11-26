-- CreateTable
CREATE TABLE "clinic_inventory_items" (
    "id" UUID NOT NULL,
    "clinic_id" UUID NOT NULL,
    "name" VARCHAR(120) NOT NULL,
    "sku" VARCHAR(60),
    "quantity" INTEGER NOT NULL DEFAULT 0,
    "min_stock" INTEGER NOT NULL DEFAULT 0,
    "unit" VARCHAR(20),
    "description" VARCHAR(255),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "clinic_inventory_items_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "clinic_inventory_items_clinic_id_name_idx" ON "clinic_inventory_items"("clinic_id", "name");

-- CreateIndex
CREATE UNIQUE INDEX "clinic_inventory_items_clinic_id_name_key" ON "clinic_inventory_items"("clinic_id", "name");

-- AddForeignKey
ALTER TABLE "clinic_inventory_items" ADD CONSTRAINT "clinic_inventory_items_clinic_id_fkey" FOREIGN KEY ("clinic_id") REFERENCES "clinics"("id") ON DELETE CASCADE ON UPDATE CASCADE;
