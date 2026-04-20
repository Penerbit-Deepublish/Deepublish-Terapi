import { Prisma } from "@prisma/client";
import { fail, ok } from "@/app/api/_utils/http";
import { getBookingDateAvailability } from "@/lib/services/booking";

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

export async function GET() {
  try {
    const data = await getBookingDateAvailability();
    return ok(data);
  } catch (error) {
    if (isMissingTableError(error)) {
      return ok([]);
    }
    return fail("Failed to load tanggal", 500);
  }
}
