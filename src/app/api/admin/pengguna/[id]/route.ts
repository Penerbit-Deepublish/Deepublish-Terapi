import { NextRequest } from "next/server";
import { Prisma } from "@prisma/client";
import { getAdminFromRequest } from "@/app/api/_utils/auth";
import { fail, ok } from "@/app/api/_utils/http";
import { deletePengguna, updatePengguna } from "@/lib/services/admin";
import { updatePenggunaSchema } from "@/lib/validators/admin";

export async function PATCH(req: NextRequest, ctx: RouteContext<"/api/admin/pengguna/[id]">) {
  const admin = getAdminFromRequest(req);
  if (!admin) return fail("Unauthorized", 401);

  const { id } = await ctx.params;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return fail("Invalid JSON payload", 400);
  }

  const parsed = updatePenggunaSchema.safeParse(body);
  if (!parsed.success) {
    return fail("Validation error", 422, parsed.error.flatten());
  }

  try {
    const updated = await updatePengguna(id, parsed.data);
    return ok(updated);
  } catch (error) {
    const prismaError = error as Prisma.PrismaClientKnownRequestError;
    if (prismaError?.code === "P2025") return fail("Pengguna tidak ditemukan", 404);
    if (prismaError?.code === "P2002") return fail("Email sudah digunakan", 409);
    return fail("Gagal memperbarui pengguna", 500);
  }
}

export async function DELETE(req: NextRequest, ctx: RouteContext<"/api/admin/pengguna/[id]">) {
  const admin = getAdminFromRequest(req);
  if (!admin) return fail("Unauthorized", 401);

  const { id } = await ctx.params;

  try {
    const deleted = await deletePengguna(id, admin.sub === "env-admin" ? undefined : admin.sub);
    if (!deleted) return fail("Pengguna tidak ditemukan", 404);
    return ok(deleted);
  } catch (error) {
    if (error instanceof Error && error.message === "CANNOT_DELETE_SELF") {
      return fail("Tidak bisa menghapus akun yang sedang digunakan", 409);
    }
    return fail("Gagal menghapus pengguna", 500);
  }
}
