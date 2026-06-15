ALTER TABLE "terapi"."jadwal_terapi"
  ADD COLUMN IF NOT EXISTS "instansi" TEXT NOT NULL DEFAULT 'Deepublish',
  ADD COLUMN IF NOT EXISTS "kapasitas_laki" INTEGER NOT NULL DEFAULT 2,
  ADD COLUMN IF NOT EXISTS "kapasitas_wanita" INTEGER NOT NULL DEFAULT 2;

UPDATE "terapi"."jadwal_terapi"
SET
  "kapasitas_laki" = GREATEST(0, COALESCE("kapasitas_laki", 2)),
  "kapasitas_wanita" = GREATEST(0, COALESCE("kapasitas_wanita", GREATEST(1, COALESCE("kuota_max", 1)) - COALESCE("kapasitas_laki", 2))),
  "kuota_max" = GREATEST(1, COALESCE("kapasitas_laki", 2) + COALESCE("kapasitas_wanita", 2));

DROP INDEX IF EXISTS "terapi"."jadwal_terapi_tanggal_sesi_id_key";
CREATE UNIQUE INDEX IF NOT EXISTS "jadwal_terapi_tanggal_sesi_id_instansi_key"
  ON "terapi"."jadwal_terapi"("tanggal", "sesi_id", "instansi");

CREATE INDEX IF NOT EXISTS "jadwal_terapi_instansi_tanggal_idx"
  ON "terapi"."jadwal_terapi"("instansi", "tanggal");
