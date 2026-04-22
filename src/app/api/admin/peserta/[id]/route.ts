import { NextRequest } from "next/server";
import { getAdminFromRequest } from "@/app/api/_utils/auth";
import { fail, ok } from "@/app/api/_utils/http";
import { deletePeserta, updatePeserta } from "@/lib/services/admin";
import { updatePesertaSchema } from "@/lib/validators/admin";

export async function PATCH(req: NextRequest, ctx: RouteContext<"/api/admin/peserta/[id]">) {
  const admin = getAdminFromRequest(req);
  if (!admin) return fail("Unauthorized", 401);

  const { id } = await ctx.params;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return fail("Invalid JSON payload", 400);
  }

  const parsed = updatePesertaSchema.safeParse(body);
  if (!parsed.success) {
    return fail("Validation error", 422, parsed.error.flatten());
  }

  try {
    const updated = await updatePeserta(id, parsed.data, admin.role);
    if (!updated) return fail("Peserta tidak ditemukan", 404);
    return ok(updated);
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "FORBIDDEN_INSTANSI") return fail("Tidak punya akses ke data instansi ini", 403);
      if (error.message === "SCHEDULE_NOT_FOUND") return fail("Jadwal tanggal belum dibuka admin", 409);
      if (error.message === "SESI_NOT_FOUND") return fail("Sesi tidak ditemukan", 404);
      if (error.message === "SESI_FULL") return fail("Sesi penuh", 409);
      if (error.message === "GENDER_QUOTA_FULL") return fail("Kuota sesi untuk jenis kelamin ini sudah penuh", 409);
      if (error.message === "QUOTA_FULL") return fail("Kuota penuh", 409);
    }
    return fail("Gagal memperbarui peserta", 500);
  }
}

export async function DELETE(req: NextRequest, ctx: RouteContext<"/api/admin/peserta/[id]">) {
  const admin = getAdminFromRequest(req);
  if (!admin) return fail("Unauthorized", 401);

  const { id } = await ctx.params;

  try {
    const deleted = await deletePeserta(id, admin.role);
    if (!deleted) {
      return fail("Peserta tidak ditemukan", 404);
    }

    return ok(deleted);
  } catch (error) {
    if (error instanceof Error && error.message === "FORBIDDEN_INSTANSI") {
      return fail("Tidak punya akses ke data instansi ini", 403);
    }
    return fail("Gagal menghapus peserta", 500);
  }
}
