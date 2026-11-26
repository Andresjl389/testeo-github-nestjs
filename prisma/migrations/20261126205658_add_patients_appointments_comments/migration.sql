-- CreateEnum
CREATE TYPE "appointment_status" AS ENUM ('PENDING', 'CONFIRMED', 'CANCELLED', 'COMPLETED');

-- CreateTable
CREATE TABLE "clinic_patients" (
    "id" UUID NOT NULL,
    "clinic_id" UUID NOT NULL,
    "name" VARCHAR(120) NOT NULL,
    "document" VARCHAR(30),
    "phone" VARCHAR(30) NOT NULL,
    "email" VARCHAR(120),
    "birth_date" DATE,
    "notes" VARCHAR(500),
    "active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "clinic_patients_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "appointments" (
    "id" UUID NOT NULL,
    "clinic_id" UUID NOT NULL,
    "patient_id" UUID NOT NULL,
    "scheduled_at" TIMESTAMPTZ(6) NOT NULL,
    "duration_minutes" INTEGER NOT NULL DEFAULT 30,
    "reason" VARCHAR(255) NOT NULL,
    "status" "appointment_status" NOT NULL DEFAULT 'PENDING',
    "notes" VARCHAR(1000),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "appointments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "appointment_comments" (
    "id" UUID NOT NULL,
    "appointment_id" UUID NOT NULL,
    "author" VARCHAR(80) NOT NULL,
    "body" VARCHAR(1000) NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "appointment_comments_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "clinic_patients_clinic_id_name_idx" ON "clinic_patients"("clinic_id", "name");

-- CreateIndex
CREATE UNIQUE INDEX "clinic_patients_clinic_id_document_key" ON "clinic_patients"("clinic_id", "document");

-- CreateIndex
CREATE INDEX "appointments_clinic_id_scheduled_at_idx" ON "appointments"("clinic_id", "scheduled_at");

-- CreateIndex
CREATE INDEX "appointments_patient_id_scheduled_at_idx" ON "appointments"("patient_id", "scheduled_at");

-- CreateIndex
CREATE INDEX "appointment_comments_appointment_id_created_at_idx" ON "appointment_comments"("appointment_id", "created_at");

-- AddForeignKey
ALTER TABLE "clinic_patients" ADD CONSTRAINT "clinic_patients_clinic_id_fkey" FOREIGN KEY ("clinic_id") REFERENCES "clinics"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_clinic_id_fkey" FOREIGN KEY ("clinic_id") REFERENCES "clinics"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "clinic_patients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "appointment_comments" ADD CONSTRAINT "appointment_comments_appointment_id_fkey" FOREIGN KEY ("appointment_id") REFERENCES "appointments"("id") ON DELETE CASCADE ON UPDATE CASCADE;
