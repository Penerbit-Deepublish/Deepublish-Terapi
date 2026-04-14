import { NextRequest } from "next/server";
import { getAdminFromRequest } from "@/app/api/_utils/auth";
import { fail, ok } from "@/app/api/_utils/http";
import { listKuota, setKuotaRange } from "@/lib/services/admin";
import { setKuotaSchema } from "@/lib/validators/admin";

export async function GET(req: NextRequest) {
  const admin = getAdminFromRequest(req);
  if (!admin) return fail("Unauthorized", 401);

  const dateFrom = req.nextUrl.searchParams.get("from") || undefined;
  const dateTo = req.nextUrl.searchParams.get("to") || undefined;
  const data = await listKuota(dateFrom, dateTo);
  return ok(data);
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
