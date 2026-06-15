ALTER TABLE "terapi"."sesi"
  ADD COLUMN IF NOT EXISTS "kapasitas_laki" INTEGER NOT NULL DEFAULT 2,
  ADD COLUMN IF NOT EXISTS "kapasitas_wanita" INTEGER NOT NULL DEFAULT 2;

UPDATE "terapi"."sesi"
SET
  "kapasitas_laki" = COALESCE(NULLIF("kapasitas_laki", 0), 2),
  "kapasitas_wanita" = COALESCE(NULLIF("kapasitas_wanita", 0), 2),
  "kapasitas" = COALESCE(NULLIF("kapasitas_laki", 0), 2) + COALESCE(NULLIF("kapasitas_wanita", 0), 2);
