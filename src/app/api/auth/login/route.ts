import { NextRequest } from "next/server";
import bcrypt from "bcryptjs";
import { Prisma } from "@prisma/client";
import { adminLoginSchema } from "@/lib/validators/admin";
import { prisma } from "@/lib/prisma";
import { fail, ok } from "@/app/api/_utils/http";
import { AUTH_COOKIE, signAdminToken } from "@/lib/auth";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";
import { DEFAULT_ADMIN_AVATAR } from "@/lib/constants";
import { isAdminRole, type AdminRole } from "@/lib/admin-roles";

export async function POST(req: NextRequest) {
  const ip = getClientIp(req.headers);
  const rate = checkRateLimit(`auth:login:${ip}`, 10);
  if (!rate.allowed) {
    return fail("Too many requests", 429, { retry_after: rate.retryAfterSec });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return fail("Invalid JSON payload", 400);
  }

  const parsed = adminLoginSchema.safeParse(body);
  if (!parsed.success) {
    return fail("Validation error", 422, parsed.error.flatten());
  }

  const envAdminEmail = process.env.ADMIN_EMAIL;
  const envAdminPassword = process.env.ADMIN_PASSWORD;

  const getEnvAdminRole = (): AdminRole => {
    const role = process.env.ADMIN_ROLE;
    return isAdminRole(role) ? role : "super";
  };

  const issueToken = (sub: string, email: string, role: AdminRole, name?: string) => {
    const defaultName = name || email.split("@")[0] || "Admin";
    const token = signAdminToken({
      sub,
      email,
      role,
      name: defaultName,
      avatar: DEFAULT_ADMIN_AVATAR,
    });
    const response = ok({ token, email, role });
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
  };

  try {
    const user = await prisma.adminUser.findUnique({ where: { email: parsed.data.email } });
    if (!user) {
      if (
        envAdminEmail &&
        envAdminPassword &&
        parsed.data.email === envAdminEmail &&
        parsed.data.password === envAdminPassword
      ) {
        return issueToken("env-admin", envAdminEmail, getEnvAdminRole(), process.env.ADMIN_NAME);
      }
      return fail("Email atau password salah", 401);
    }

    const validPassword = await bcrypt.compare(parsed.data.password, user.passwordHash);
    if (!validPassword) {
      return fail("Email atau password salah", 401);
    }

    const role = isAdminRole(user.role) ? user.role : "super";
    return issueToken(user.id, user.email, role, user.name);
  } catch (error) {
    // Bootstrapping fallback: if admin table doesn't exist yet, allow env admin login.
    const prismaError = error as Prisma.PrismaClientKnownRequestError;
    const isMissingTable =
      prismaError?.code === "P2021" ||
      (error instanceof Error && /relation .*admin_users.* does not exist/i.test(error.message));

    if (
      isMissingTable &&
      envAdminEmail &&
      envAdminPassword &&
      parsed.data.email === envAdminEmail &&
      parsed.data.password === envAdminPassword
    ) {
      return issueToken("env-admin", envAdminEmail, getEnvAdminRole(), process.env.ADMIN_NAME);
    }

    return fail("Login gagal: konfigurasi database admin belum siap", 500);
  }
}
