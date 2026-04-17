import { NextRequest } from "next/server";
import { Prisma } from "@prisma/client";
import { getAdminFromRequest } from "@/app/api/_utils/auth";
import { fail, ok } from "@/app/api/_utils/http";
import { createPengguna, listPengguna } from "@/lib/services/admin";
import { createPenggunaSchema, penggunaQuerySchema } from "@/lib/validators/admin";

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

  const parsed = penggunaQuerySchema.safeParse(query);
  if (!parsed.success) {
    return fail("Invalid query", 422, parsed.error.flatten());
  }

  const data = await listPengguna(
    parsed.data.page,
    parsed.data.pageSize,
    parsed.data.q,
    parsed.data.from,
    parsed.data.to,
  );
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

  const parsed = createPenggunaSchema.safeParse(body);
  if (!parsed.success) {
    return fail("Validation error", 422, parsed.error.flatten());
  }

  try {
    const created = await createPengguna(parsed.data);
    return ok(created, { status: 201 });
  } catch (error) {
    const prismaError = error as Prisma.PrismaClientKnownRequestError;
    if (prismaError?.code === "P2002") {
      return fail("Email sudah digunakan", 409);
    }
    return fail("Gagal membuat pengguna", 500);
  }
}
