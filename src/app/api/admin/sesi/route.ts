import { NextRequest } from "next/server";
import { getAdminFromRequest } from "@/app/api/_utils/auth";
import { fail, ok } from "@/app/api/_utils/http";
import { listSesi, upsertSesi } from "@/lib/services/admin";
import { setSesiSchema } from "@/lib/validators/admin";

export async function GET(req: NextRequest) {
  const admin = getAdminFromRequest(req);
  if (!admin) return fail("Unauthorized", 401);

  const data = await listSesi();
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

  const parsed = setSesiSchema.safeParse(body);
  if (!parsed.success) {
    return fail("Validation error", 422, parsed.error.flatten());
  }

  try {
    const data = await upsertSesi(parsed.data);
    return ok(data);
  } catch {
    return fail("Failed to save sesi", 500);
  }
}
