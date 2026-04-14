-- Create schema used by HRIS domain
CREATE SCHEMA IF NOT EXISTS "hris";

-- Main booking table (required name: hris.terapi)
CREATE TABLE IF NOT EXISTS "hris"."terapi" (
  "id" UUID NOT NULL,
  "nama_lengkap" TEXT NOT NULL,
  "nomor_hp" TEXT NOT NULL,
  "usia" INTEGER,
  "alamat" TEXT,
  "jenis_kelamin" TEXT NOT NULL,
  "lokasi_terapi" TEXT NOT NULL,
  "tanggal_terapi" DATE NOT NULL,
  "keluhan" TEXT[],
  "catatan_tambahan" TEXT,
  "paket" TEXT NOT NULL,
  "jam_sesi" TEXT NOT NULL,
  "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "terapi_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "hris"."admin_users" (
  "id" UUID NOT NULL,
  "email" TEXT NOT NULL,
  "password_hash" TEXT NOT NULL,
  CONSTRAINT "admin_users_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "hris"."kuota" (
  "id" UUID NOT NULL,
  "tanggal" DATE NOT NULL,
  "kuota_max" INTEGER NOT NULL,
  "kuota_terpakai" INTEGER NOT NULL DEFAULT 0,
  CONSTRAINT "kuota_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "hris"."sesi" (
  "id" UUID NOT NULL,
  "jam" TEXT NOT NULL,
  "kapasitas" INTEGER NOT NULL,
  "terisi" INTEGER NOT NULL DEFAULT 0,
  CONSTRAINT "sesi_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "admin_users_email_key" ON "hris"."admin_users"("email");
CREATE UNIQUE INDEX IF NOT EXISTS "kuota_tanggal_key" ON "hris"."kuota"("tanggal");
CREATE UNIQUE INDEX IF NOT EXISTS "sesi_jam_key" ON "hris"."sesi"("jam");

CREATE INDEX IF NOT EXISTS "terapi_tanggal_terapi_idx" ON "hris"."terapi"("tanggal_terapi");
CREATE INDEX IF NOT EXISTS "terapi_tanggal_terapi_jam_sesi_idx" ON "hris"."terapi"("tanggal_terapi", "jam_sesi");
CREATE INDEX IF NOT EXISTS "kuota_tanggal_idx" ON "hris"."kuota"("tanggal");
CREATE INDEX IF NOT EXISTS "sesi_jam_idx" ON "hris"."sesi"("jam");
