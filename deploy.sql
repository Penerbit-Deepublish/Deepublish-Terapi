-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "hris";

-- CreateTable
CREATE TABLE "hris"."terapi" (
    "id" UUID NOT NULL,
    "nama_lengkap" TEXT NOT NULL,
    "nomor_hp" TEXT,
    "usia" INTEGER,
    "alamat" TEXT,
    "jenis_kelamin" TEXT NOT NULL,
    "lokasi_terapi" TEXT NOT NULL,
    "tanggal_terapi" DATE NOT NULL,
    "keluhan" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    "catatan_tambahan" TEXT,
    "paket" TEXT NOT NULL,
    "jam_sesi" TEXT NOT NULL,
    "departemen" TEXT,
    "status_kepesertaan" TEXT,
    "tanggal_lahir" DATE,
    "keluhan_luar" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    "keluhan_luar_lainnya" TEXT,
    "keluhan_dalam" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    "keluhan_dalam_lainnya" TEXT,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "terapi_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hris"."admin_users" (
    "id" UUID NOT NULL,
    "email" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,

    CONSTRAINT "admin_users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hris"."kuota" (
    "id" UUID NOT NULL,
    "tanggal" DATE NOT NULL,
    "kuota_max" INTEGER NOT NULL,
    "kuota_terpakai" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "kuota_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hris"."sesi" (
    "id" UUID NOT NULL,
    "jam" TEXT NOT NULL,
    "kapasitas" INTEGER NOT NULL,
    "terisi" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "sesi_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "terapi_tanggal_terapi_idx" ON "hris"."terapi"("tanggal_terapi");

-- CreateIndex
CREATE INDEX "terapi_tanggal_terapi_jam_sesi_idx" ON "hris"."terapi"("tanggal_terapi", "jam_sesi");

-- CreateIndex
CREATE UNIQUE INDEX "admin_users_email_key" ON "hris"."admin_users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "kuota_tanggal_key" ON "hris"."kuota"("tanggal");

-- CreateIndex
CREATE INDEX "kuota_tanggal_idx" ON "hris"."kuota"("tanggal");

-- CreateIndex
CREATE UNIQUE INDEX "sesi_jam_key" ON "hris"."sesi"("jam");

-- CreateIndex
CREATE INDEX "sesi_jam_idx" ON "hris"."sesi"("jam");
