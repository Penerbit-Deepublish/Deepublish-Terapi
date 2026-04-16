import { NextRequest } from "next/server";
import { Prisma } from "@prisma/client";
import { getAdminFromRequest } from "@/app/api/_utils/auth";
import { fail, ok } from "@/app/api/_utils/http";
import { prisma } from "@/lib/prisma";
import { AUTH_COOKIE, signAdminToken } from "@/lib/auth";
import { DEFAULT_ADMIN_AVATAR } from "@/lib/constants";
import { adminProfileUpdateSchema } from "@/lib/validators/admin";

function getDefaultName(email: string) {
  return email.split("@")[0] || "Admin";
}

function issueCookie(
  sub: string,
  email: string,
  name: string,
  avatar: string,
) {
  const token = signAdminToken({
    sub,
    email,
    role: "admin",
    name,
    avatar,
  });

  const response = ok({
    sub,
    email,
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

  if (admin.sub === "env-admin") {
    return ok({
      email: admin.email,
      name: fallbackName,
      avatar: fallbackAvatar,
    });
  }

  try {
    const user = await prisma.adminUser.findUnique({
      where: { id: admin.sub },
      select: { email: true },
    });

    return ok({
      email: user?.email ?? admin.email,
      name: fallbackName,
      avatar: fallbackAvatar,
    });
  } catch (error) {
    if (isMissingTableError(error)) {
      return ok({
        email: admin.email,
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

  if (admin.sub === "env-admin") {
    return issueCookie(admin.sub, nextEmail, nextName, nextAvatar);
  }

  try {
    const updated = await prisma.adminUser.update({
      where: { id: admin.sub },
      data: { email: nextEmail },
      select: { id: true, email: true },
    });

    return issueCookie(updated.id, updated.email, nextName, nextAvatar);
  } catch (error) {
    const prismaError = error as Prisma.PrismaClientKnownRequestError;
    if (prismaError?.code === "P2002") {
      return fail("Email sudah digunakan", 409);
    }
    if (isMissingTableError(error)) {
      return issueCookie(admin.sub, nextEmail, nextName, nextAvatar);
    }
    return fail("Gagal menyimpan profil", 500);
  }
}
