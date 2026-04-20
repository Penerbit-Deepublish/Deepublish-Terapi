-- Add relational schedule+quota table per session
CREATE TABLE IF NOT EXISTS "terapi"."jadwal_terapi" (
  "id" UUID NOT NULL,
  "tanggal" DATE NOT NULL,
  "sesi_id" UUID NOT NULL,
  "kuota_max" INTEGER NOT NULL DEFAULT 3,
  "kuota_terpakai" INTEGER NOT NULL DEFAULT 0,
  "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "jadwal_terapi_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "terapi"."terapi"
  ADD COLUMN IF NOT EXISTS "jadwal_terapi_id" UUID;

CREATE UNIQUE INDEX IF NOT EXISTS "jadwal_terapi_tanggal_sesi_id_key"
  ON "terapi"."jadwal_terapi"("tanggal", "sesi_id");

CREATE INDEX IF NOT EXISTS "jadwal_terapi_tanggal_idx"
  ON "terapi"."jadwal_terapi"("tanggal");

CREATE INDEX IF NOT EXISTS "jadwal_terapi_sesi_id_idx"
  ON "terapi"."jadwal_terapi"("sesi_id");

CREATE INDEX IF NOT EXISTS "terapi_jadwal_terapi_id_idx"
  ON "terapi"."terapi"("jadwal_terapi_id");

ALTER TABLE "terapi"."jadwal_terapi"
  ADD CONSTRAINT "jadwal_terapi_sesi_id_fkey"
  FOREIGN KEY ("sesi_id") REFERENCES "terapi"."sesi"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "terapi"."terapi"
  ADD CONSTRAINT "terapi_jadwal_terapi_id_fkey"
  FOREIGN KEY ("jadwal_terapi_id") REFERENCES "terapi"."jadwal_terapi"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;
