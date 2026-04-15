-- Reset fields used by public registration form to match the new input format

ALTER TABLE "hris"."terapi"
  ALTER COLUMN "nomor_hp" DROP NOT NULL;

-- Ensure existing list column is always non-null for Prisma
UPDATE "hris"."terapi" SET "keluhan" = ARRAY[]::TEXT[] WHERE "keluhan" IS NULL;
ALTER TABLE "hris"."terapi"
  ALTER COLUMN "keluhan" SET DEFAULT ARRAY[]::TEXT[],
  ALTER COLUMN "keluhan" SET NOT NULL;

ALTER TABLE "hris"."terapi"
  ADD COLUMN IF NOT EXISTS "departemen" TEXT,
  ADD COLUMN IF NOT EXISTS "status_kepesertaan" TEXT,
  ADD COLUMN IF NOT EXISTS "tanggal_lahir" DATE,
  ADD COLUMN IF NOT EXISTS "keluhan_luar" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  ADD COLUMN IF NOT EXISTS "keluhan_luar_lainnya" TEXT,
  ADD COLUMN IF NOT EXISTS "keluhan_dalam" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  ADD COLUMN IF NOT EXISTS "keluhan_dalam_lainnya" TEXT;

