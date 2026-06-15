import { NextRequest } from "next/server";
import { getAdminFromRequest } from "@/app/api/_utils/auth";
import { fail, ok } from "@/app/api/_utils/http";
import { isInstansi } from "@/lib/kepesertaan";
import { listSesiKuotaByTanggal, upsertBulkSesiKuota, upsertSesiKuota } from "@/lib/services/admin";
import { sesiKuotaQuerySchema, setBulkSesiKuotaSchema, setSesiKuotaSchema } from "@/lib/validators/admin";

export async function GET(req: NextRequest) {
  const admin = getAdminFromRequest(req);
  if (!admin) return fail("Unauthorized", 401);

  const query = {
    instansi: req.nextUrl.searchParams.get("instansi") || undefined,
  };
  if (query.instansi && !isInstansi(query.instansi)) {
    return fail("Invalid query", 422);
  }

  const parsed = sesiKuotaQuerySchema.safeParse(query);
  if (!parsed.success) {
    return fail("Invalid query", 422, parsed.error.flatten());
  }

  try {
    const data = await listSesiKuotaByTanggal(parsed.data.instansi, admin.role);
    return ok(data);
  } catch (error) {
    if (error instanceof Error && error.message === "FORBIDDEN_INSTANSI") {
      return fail("Forbidden", 403);
    }
    return fail("Failed to load sesi quota", 500);
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

  // Check if it's a bulk update
  const isBulk = body && typeof body === "object" && "items" in body && Array.isArray((body as Record<string, unknown>).items);
  if (isBulk) {
    const parsed = setBulkSesiKuotaSchema.safeParse(body);
    if (!parsed.success) {
      return fail("Validation error", 422, parsed.error.flatten());
    }

    try {
      const data = await upsertBulkSesiKuota(parsed.data, admin.role);
      return ok(data);
    } catch (error) {
      if (error instanceof Error && error.message === "FORBIDDEN_INSTANSI") {
        return fail("Forbidden", 403);
      }
      if (error instanceof Error && error.message.startsWith("SESI_NOT_FOUND")) {
        return fail("Sesi tidak ditemukan", 404);
      }
      return fail("Failed to save sesi quota", 500);
    }
  }

  const parsed = setSesiKuotaSchema.safeParse(body);
  if (!parsed.success) {
    return fail("Validation error", 422, parsed.error.flatten());
  }

  try {
    const data = await upsertSesiKuota(parsed.data, admin.role);
    return ok(data);
  } catch (error) {
    if (error instanceof Error && error.message === "FORBIDDEN_INSTANSI") {
      return fail("Forbidden", 403);
    }
    if (error instanceof Error && error.message === "SESI_NOT_FOUND") {
      return fail("Sesi tidak ditemukan", 404);
    }
    if (error instanceof Error && error.message === "SESSION_QUOTA_BELOW_BOOKING") {
      return fail("Kuota gender tidak boleh lebih kecil dari booking yang sudah masuk", 409);
    }
    return fail("Failed to save sesi quota", 500);
  }
}
