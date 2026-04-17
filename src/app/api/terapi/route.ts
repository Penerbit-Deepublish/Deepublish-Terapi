import { NextRequest } from "next/server";
import { bookingApiSchema } from "@/lib/validators/terapi";
import { createBooking } from "@/lib/services/booking";
import { fail, ok } from "@/app/api/_utils/http";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";

export async function POST(req: NextRequest) {
  const ip = getClientIp(req.headers);
  const rate = checkRateLimit(`public:booking:${ip}`, 20);
  if (!rate.allowed) {
    return fail("Too many requests", 429, { retry_after: rate.retryAfterSec });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return fail("Invalid JSON payload", 400);
  }

  const parsed = bookingApiSchema.safeParse(body);
  if (!parsed.success) {
    return fail("Validation error", 422, parsed.error.flatten());
  }

  try {
    const result = await createBooking(parsed.data);
    return ok(result, { status: 201 });
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "SESI_NOT_FOUND") return fail("Sesi tidak ditemukan", 404);
      if (error.message === "SESI_FULL") return fail("Sesi penuh", 409);
      if (error.message === "QUOTA_FULL") return fail("Kuota penuh", 409);
      if (error.message === "SCHEDULE_NOT_FOUND") return fail("Jadwal tanggal belum dibuka admin", 409);
    }
    return fail("Failed to create booking", 500);
  }
}
