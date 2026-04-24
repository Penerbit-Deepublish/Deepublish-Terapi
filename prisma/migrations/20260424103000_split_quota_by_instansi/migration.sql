ALTER TABLE "terapi"."kuota"
ADD COLUMN IF NOT EXISTS "instansi" TEXT NOT NULL DEFAULT 'Deepublish';

DROP INDEX IF EXISTS "terapi"."kuota_tanggal_key";
CREATE UNIQUE INDEX IF NOT EXISTS "kuota_tanggal_instansi_key"
  ON "terapi"."kuota"("tanggal", "instansi");
CREATE INDEX IF NOT EXISTS "kuota_instansi_tanggal_idx"
  ON "terapi"."kuota"("instansi", "tanggal");

INSERT INTO "terapi"."kuota" ("id", "tanggal", "instansi", "kuota_max", "kuota_terpakai")
SELECT
  md5(k."id"::text || '-IMBS')::uuid,
  k."tanggal",
  'IMBS',
  k."kuota_max",
  0
FROM "terapi"."kuota" k
WHERE k."instansi" = 'Deepublish'
  AND NOT EXISTS (
    SELECT 1
    FROM "terapi"."kuota" existing
    WHERE existing."tanggal" = k."tanggal"
      AND existing."instansi" = 'IMBS'
  );

UPDATE "terapi"."kuota" q
SET "kuota_terpakai" = 0;

UPDATE "terapi"."kuota" q
SET "kuota_terpakai" = usage."total"
FROM (
  SELECT
    t."tanggal_terapi" AS "tanggal",
    t."instansi",
    COUNT(*)::int AS "total"
  FROM "terapi"."terapi" t
  GROUP BY t."tanggal_terapi", t."instansi"
) usage
WHERE q."tanggal" = usage."tanggal"
  AND q."instansi" = usage."instansi";
