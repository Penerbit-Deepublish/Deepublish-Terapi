import { NextRequest } from "next/server";
import { fail, ok } from "@/app/api/_utils/http";
import { getQuotaByDate } from "@/lib/services/booking";
import { quotaQuerySchema } from "@/lib/validators/terapi";

export async function GET(req: NextRequest) {
  const query = Object.fromEntries(req.nextUrl.searchParams.entries());
  const parsed = quotaQuerySchema.safeParse(query);

  if (!parsed.success) {
    return fail("Invalid query", 422, parsed.error.flatten());
  }

  try {
    const data = await getQuotaByDate(parsed.data.tanggal, parsed.data.instansi);
    return ok(data);
  } catch {
    return fail("Failed to load quota", 500);
  }
}
