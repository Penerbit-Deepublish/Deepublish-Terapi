import { NextRequest } from "next/server";
import { fail, ok } from "@/app/api/_utils/http";
import { getSesiAvailability } from "@/lib/services/booking";
import { sesiQuerySchema } from "@/lib/validators/terapi";

export async function GET(req: NextRequest) {
  const query = Object.fromEntries(req.nextUrl.searchParams.entries());
  const parsed = sesiQuerySchema.safeParse(query);

  if (!parsed.success) {
    return fail("Invalid query", 422, parsed.error.flatten());
  }

  try {
    const data = await getSesiAvailability(
      parsed.data.tanggal,
      parsed.data.jenis_kelamin,
      parsed.data.instansi,
    );
    return ok(data);
  } catch {
    return fail("Failed to load sesi", 500);
  }
}
