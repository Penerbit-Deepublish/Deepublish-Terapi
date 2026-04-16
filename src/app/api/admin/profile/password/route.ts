import { NextRequest } from "next/server";
import bcrypt from "bcryptjs";
import { getAdminFromRequest } from "@/app/api/_utils/auth";
import { fail, ok } from "@/app/api/_utils/http";
import { prisma } from "@/lib/prisma";
import { adminPasswordChangeSchema } from "@/lib/validators/admin";

export async function PATCH(req: NextRequest) {
  const admin = getAdminFromRequest(req);
  if (!admin) return fail("Unauthorized", 401);

  if (admin.sub === "env-admin") {
    return fail("Akun env-admin tidak mendukung ubah password dari aplikasi", 422);
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return fail("Invalid JSON payload", 400);
  }

  const parsed = adminPasswordChangeSchema.safeParse(body);
  if (!parsed.success) {
    return fail("Validation error", 422, parsed.error.flatten());
  }

  const user = await prisma.adminUser.findUnique({
    where: { id: admin.sub },
    select: { id: true, passwordHash: true },
  });
  if (!user) {
    return fail("Admin tidak ditemukan", 404);
  }

  const validCurrentPassword = await bcrypt.compare(
    parsed.data.current_password,
    user.passwordHash,
  );
  if (!validCurrentPassword) {
    return fail("Password saat ini salah", 401);
  }

  const nextPasswordHash = await bcrypt.hash(parsed.data.new_password, 10);
  await prisma.adminUser.update({
    where: { id: user.id },
    data: { passwordHash: nextPasswordHash },
  });

  return ok({ message: "Password berhasil diperbarui" });
}
