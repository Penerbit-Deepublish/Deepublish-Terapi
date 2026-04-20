import { NextRequest } from "next/server";
import { Prisma } from "@prisma/client";
import { getAdminFromRequest } from "@/app/api/_utils/auth";
import { fail, ok } from "@/app/api/_utils/http";
import { deleteKuotaByTanggal, listKuota, setKuotaRange } from "@/lib/services/admin";
import { deleteKuotaQuerySchema, setKuotaSchema } from "@/lib/validators/admin";

export async function GET(req: NextRequest) {
  const admin = getAdminFromRequest(req);
  if (!admin) return fail("Unauthorized", 401);

  const dateFrom = req.nextUrl.searchParams.get("from") || undefined;
  const dateTo = req.nextUrl.searchParams.get("to") || undefined;
  try {
    const data = await listKuota(dateFrom, dateTo);
    return ok(data);
  } catch (error) {
    if (error instanceof Error && error.message === "INVALID_DATE_RANGE") {
      return fail("Invalid date range", 422);
    }

    const prismaError = error as Prisma.PrismaClientKnownRequestError;
    const isMissingTable =
      prismaError?.code === "P2021" ||
      (error instanceof Error && /relation .* does not exist/i.test(error.message));
    if (isMissingTable) {
      return fail("Database belum siap. Jalankan migrasi Prisma terlebih dahulu", 500);
    }

    return fail("Failed to load quota", 500);
  }
}

export async function POST(req: NextRequest) {
  const admin = getAdminFromRequest(req);
  if (!admin) return fail("Unauthorized", 401);

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return fail("Invalid JSON payload", 400);
  }

  const parsed = setKuotaSchema.safeParse(body);
  if (!parsed.success) {
    return fail("Validation error", 422, parsed.error.flatten());
  }

  try {
    const data = await setKuotaRange(parsed.data);
    return ok(data);
  } catch (error) {
    if (error instanceof Error && error.message === "INVALID_DATE_RANGE") {
      return fail("Invalid date range", 422);
    }
    return fail("Failed to set quota", 500);
  }
}

export async function DELETE(req: NextRequest) {
  const admin = getAdminFromRequest(req);
  if (!admin) return fail("Unauthorized", 401);

  const query = {
    tanggal: req.nextUrl.searchParams.get("tanggal") ?? "",
  };
  const parsed = deleteKuotaQuerySchema.safeParse(query);
  if (!parsed.success) {
    return fail("Invalid query", 422, parsed.error.flatten());
  }

  try {
    const result = await deleteKuotaByTanggal(parsed.data.tanggal);
    if (!result) return fail("Kuota tidak ditemukan", 404);
    return ok(result);
  } catch (error) {
    if (error instanceof Error && error.message === "QUOTA_HAS_BOOKING") {
      return fail("Kuota tidak bisa dihapus karena sudah memiliki reservasi", 409);
    }
    return fail("Failed to delete quota", 500);
  }
}
