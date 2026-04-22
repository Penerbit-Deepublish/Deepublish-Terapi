import { NextRequest } from "next/server";
import { Prisma } from "@prisma/client";
import { getAdminFromRequest } from "@/app/api/_utils/auth";
import { fail, ok } from "@/app/api/_utils/http";
import { prisma } from "@/lib/prisma";
import { AUTH_COOKIE, signAdminToken } from "@/lib/auth";
import { DEFAULT_ADMIN_AVATAR } from "@/lib/constants";
import { adminProfileUpdateSchema } from "@/lib/validators/admin";
import { isAdminRole, type AdminRole } from "@/lib/admin-roles";

function getDefaultName(email: string) {
  return email.split("@")[0] || "Admin";
}

function issueCookie(
  sub: string,
  email: string,
  role: AdminRole,
  name: string,
  avatar: string,
) {
  const token = signAdminToken({
    sub,
    email,
    role,
    name,
    avatar,
  });

  const response = ok({
    sub,
    email,
    role,
    name,
    avatar,
  });

  response.cookies.set({
    name: AUTH_COOKIE,
    value: token,
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 12,
  });

  return response;
}

function getEnvAdminRole(): AdminRole {
  return isAdminRole(process.env.ADMIN_ROLE) ? process.env.ADMIN_ROLE : "super";
}

function isMissingTableError(error: unknown) {
  const prismaError = error as Prisma.PrismaClientKnownRequestError;
  if (prismaError?.code === "P2021") return true;
  if (error instanceof Error) {
    return /relation .*admin_users.* does not exist/i.test(error.message);
  }
  return false;
}

export async function GET(req: NextRequest) {
  const admin = getAdminFromRequest(req);
  if (!admin) return fail("Unauthorized", 401);

  const fallbackName = admin.name || getDefaultName(admin.email);
  const fallbackAvatar = admin.avatar || DEFAULT_ADMIN_AVATAR;
  const fallbackRole = isAdminRole(admin.role) ? admin.role : "super";

  if (admin.sub === "env-admin") {
    return ok({
      email: admin.email,
      role: fallbackRole,
      name: fallbackName,
      avatar: fallbackAvatar,
    });
  }

  try {
    const user = await prisma.adminUser.findUnique({
      where: { id: admin.sub },
      select: { email: true, name: true, role: true },
    });
    const role = isAdminRole(user?.role) ? user.role : fallbackRole;

    return ok({
      email: user?.email ?? admin.email,
      role,
      name: user?.name ?? fallbackName,
      avatar: fallbackAvatar,
    });
  } catch (error) {
    if (isMissingTableError(error)) {
      return ok({
        email: admin.email,
        role: fallbackRole,
        name: fallbackName,
        avatar: fallbackAvatar,
      });
    }
    return fail("Gagal memuat profil", 500);
  }
}

export async function PATCH(req: NextRequest) {
  const admin = getAdminFromRequest(req);
  if (!admin) return fail("Unauthorized", 401);

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return fail("Invalid JSON payload", 400);
  }

  const parsed = adminProfileUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return fail("Validation error", 422, parsed.error.flatten());
  }

  const nextEmail = parsed.data.email.trim().toLowerCase();
  const nextName = parsed.data.name.trim() || getDefaultName(nextEmail);
  const nextAvatar = parsed.data.avatar.trim() || DEFAULT_ADMIN_AVATAR;
  const currentRole = isAdminRole(admin.role) ? admin.role : getEnvAdminRole();

  if (admin.sub === "env-admin") {
    return issueCookie(admin.sub, nextEmail, currentRole, nextName, nextAvatar);
  }

  try {
    const updated = await prisma.adminUser.update({
      where: { id: admin.sub },
      data: { email: nextEmail, name: nextName },
      select: { id: true, email: true, name: true, role: true },
    });

    const role = isAdminRole(updated.role) ? updated.role : currentRole;
    return issueCookie(updated.id, updated.email, role, nextName || updated.name, nextAvatar);
  } catch (error) {
    const prismaError = error as Prisma.PrismaClientKnownRequestError;
    if (prismaError?.code === "P2002") {
      return fail("Email sudah digunakan", 409);
    }
    if (isMissingTableError(error)) {
      return issueCookie(admin.sub, nextEmail, currentRole, nextName, nextAvatar);
    }
    return fail("Gagal menyimpan profil", 500);
  }
}
