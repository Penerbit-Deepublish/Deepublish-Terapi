import { NextRequest } from "next/server";
import { getAdminFromRequest } from "@/app/api/_utils/auth";
import { fail, ok } from "@/app/api/_utils/http";
import { listPeserta } from "@/lib/services/admin";
import { pesertaQuerySchema } from "@/lib/validators/admin";

export async function GET(req: NextRequest) {
  const admin = getAdminFromRequest(req);
  if (!admin) return fail("Unauthorized", 401);

  const query = {
    page: req.nextUrl.searchParams.get("page") ?? 1,
    pageSize: req.nextUrl.searchParams.get("pageSize") ?? 15,
    q: req.nextUrl.searchParams.get("q") ?? undefined,
    from: req.nextUrl.searchParams.get("from") ?? undefined,
    to: req.nextUrl.searchParams.get("to") ?? undefined,
  };

  const parsed = pesertaQuerySchema.safeParse(query);
  if (!parsed.success) {
    return fail("Invalid query", 422, parsed.error.flatten());
  }

  const data = await listPeserta(
    parsed.data.page,
    parsed.data.pageSize,
    parsed.data.q,
    parsed.data.from,
    parsed.data.to,
    admin.role,
  );
  return ok(data);
}
