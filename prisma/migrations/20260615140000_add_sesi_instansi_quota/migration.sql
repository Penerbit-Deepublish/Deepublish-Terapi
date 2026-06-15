CREATE TABLE IF NOT EXISTS "terapi"."sesi_instansi_quota" (
  "id" UUID NOT NULL,
  "sesi_id" UUID NOT NULL,
  "instansi" TEXT NOT NULL DEFAULT 'Deepublish',
  "kuota_max" INTEGER NOT NULL DEFAULT 4,
  "kapasitas_laki" INTEGER NOT NULL DEFAULT 2,
  "kapasitas_wanita" INTEGER NOT NULL DEFAULT 2,
  "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "sesi_instansi_quota_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "sesi_instansi_quota_sesi_id_instansi_key"
  ON "terapi"."sesi_instansi_quota"("sesi_id", "instansi");

CREATE INDEX IF NOT EXISTS "sesi_instansi_quota_instansi_idx"
  ON "terapi"."sesi_instansi_quota"("instansi");

ALTER TABLE "terapi"."sesi_instansi_quota"
  ADD CONSTRAINT "sesi_instansi_quota_sesi_id_fkey"
  FOREIGN KEY ("sesi_id") REFERENCES "terapi"."sesi"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;
