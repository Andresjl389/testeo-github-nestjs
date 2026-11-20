-- Endurece el esquema inicial sin editar la migración ya integrada:
-- longitudes máximas, TIMESTAMPTZ en fechas e índice para búsqueda por nombre.

-- AlterTable
ALTER TABLE "categories"
  ALTER COLUMN "name" SET DATA TYPE VARCHAR(120),
  ALTER COLUMN "created_at" SET DATA TYPE TIMESTAMPTZ(6) USING "created_at" AT TIME ZONE 'UTC',
  ALTER COLUMN "updated_at" SET DATA TYPE TIMESTAMPTZ(6) USING "updated_at" AT TIME ZONE 'UTC';

-- AlterTable
ALTER TABLE "products"
  ALTER COLUMN "name" SET DATA TYPE VARCHAR(200),
  ALTER COLUMN "sku" SET DATA TYPE VARCHAR(100),
  ALTER COLUMN "created_at" SET DATA TYPE TIMESTAMPTZ(6) USING "created_at" AT TIME ZONE 'UTC',
  ALTER COLUMN "updated_at" SET DATA TYPE TIMESTAMPTZ(6) USING "updated_at" AT TIME ZONE 'UTC';

-- AlterTable
ALTER TABLE "inventory_movements"
  ALTER COLUMN "description" SET DATA TYPE VARCHAR(255),
  ALTER COLUMN "created_at" SET DATA TYPE TIMESTAMPTZ(6) USING "created_at" AT TIME ZONE 'UTC';

-- CreateIndex (búsquedas por nombre de producto)
CREATE INDEX "products_name_idx" ON "products"("name");
