import { Prisma } from "@prisma/client";
import { NextRequest } from "next/server";
import { fail, ok } from "@/app/api/_utils/http";
import { getBookingDateAvailability } from "@/lib/services/booking";
import { tanggalQuerySchema } from "@/lib/validators/terapi";

function isMissingTableError(error: unknown) {
  const prismaError = error as Prisma.PrismaClientKnownRequestError;
  if (prismaError?.code === "P2021") {
    return true;
  }

  if (error instanceof Error) {
    return /relation .* does not exist/i.test(error.message);
  }

  return false;
}

export async function GET(req: NextRequest) {
  const query = Object.fromEntries(req.nextUrl.searchParams.entries());
  const parsed = tanggalQuerySchema.safeParse(query);
  if (!parsed.success) {
    return fail("Invalid query", 422, parsed.error.flatten());
  }

  try {
    const data = await getBookingDateAvailability(parsed.data.instansi);
    return ok(data);
  } catch (error) {
    if (isMissingTableError(error)) {
      return ok([]);
    }
    return fail("Failed to load tanggal", 500);
  }
}
