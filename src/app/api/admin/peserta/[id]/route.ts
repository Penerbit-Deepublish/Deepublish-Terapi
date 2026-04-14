import { NextRequest } from "next/server";
import { getAdminFromRequest } from "@/app/api/_utils/auth";
import { fail, ok } from "@/app/api/_utils/http";
import { deletePeserta } from "@/lib/services/admin";

export async function DELETE(req: NextRequest, ctx: RouteContext<"/api/admin/peserta/[id]">) {
  const admin = getAdminFromRequest(req);
  if (!admin) return fail("Unauthorized", 401);

  const { id } = await ctx.params;

  const deleted = await deletePeserta(id);
  if (!deleted) {
    return fail("Peserta tidak ditemukan", 404);
  }

  return ok(deleted);
}
