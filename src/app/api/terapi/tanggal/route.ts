import { fail, ok } from "@/app/api/_utils/http";
import { getBookingDateAvailability } from "@/lib/services/booking";

export async function GET() {
  try {
    const data = await getBookingDateAvailability();
    return ok(data);
  } catch {
    return fail("Failed to load tanggal", 500);
  }
}
