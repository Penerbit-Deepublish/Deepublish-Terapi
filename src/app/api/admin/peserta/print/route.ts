import { NextRequest } from "next/server";
import { Prisma } from "@prisma/client";
import { getAdminFromRequest } from "@/app/api/_utils/auth";
import { fail, ok } from "@/app/api/_utils/http";
import { prisma } from "@/lib/prisma";
import { parseDateOnly } from "@/lib/services/date";
import { getAdminInstansiScope } from "@/lib/admin-roles";

function normalizeJam(value: string) {
  return value.replaceAll(".", ":").replace(/\s*-\s*/g, " - ").trim();
}

export async function GET(req: NextRequest) {
  const admin = getAdminFromRequest(req);
  if (!admin) return fail("Unauthorized", 401);

  const tanggal = req.nextUrl.searchParams.get("tanggal");
  if (!tanggal || !/^\d{4}-\d{2}-\d{2}$/.test(tanggal)) {
    return fail("Parameter tanggal wajib diisi (format YYYY-MM-DD)", 422);
  }

  const scopedInstansi = getAdminInstansiScope(admin.role);
  const sqlConditions: Prisma.Sql[] = [
    Prisma.sql`t.tanggal_terapi = ${parseDateOnly(tanggal)}::date`,
  ];
  if (scopedInstansi) {
    sqlConditions.push(Prisma.sql`t.instansi = ${scopedInstansi}`);
  }

  const rows = await prisma.$queryRaw<
    Array<{ nama_lengkap: string; jenis_kelamin: "L" | "P"; jam: string }>
  >(Prisma.sql`
    SELECT
      t.nama_lengkap,
      t.jenis_kelamin,
      COALESCE(s.jam, t.jam_sesi) AS jam
    FROM "terapi"."terapi" t
    LEFT JOIN "terapi"."sesi" s
      ON t.jam_sesi = s.id::text OR t.jam_sesi = s.jam
    WHERE ${Prisma.join(sqlConditions, " AND ")}
    ORDER BY
      substring(replace(COALESCE(s.jam, t.jam_sesi), '.', ':') from 1 for 5) ASC,
      t.nama_lengkap ASC
  `);

  const laki = rows
    .filter((row) => row.jenis_kelamin === "L")
    .map((row) => ({ jam: normalizeJam(row.jam), nama: row.nama_lengkap }));
  const perempuan = rows
    .filter((row) => row.jenis_kelamin === "P")
    .map((row) => ({ jam: normalizeJam(row.jam), nama: row.nama_lengkap }));

  return ok({ tanggal, laki, perempuan });
}
