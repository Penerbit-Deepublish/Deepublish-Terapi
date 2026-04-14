import { NextRequest } from "next/server";
import { Prisma } from "@prisma/client";
import { getAdminFromRequest } from "@/app/api/_utils/auth";
import { fail, ok } from "@/app/api/_utils/http";
import { getDashboardData } from "@/lib/services/admin";

function getEmptyDashboard() {
  return {
    stats: {
      total_peserta_bulan_ini: 0,
      sisa_kuota_hari_ini: 0,
      total_sesi_hari_ini: 0,
    },
    charts: {
      tren_reservasi_harian: [],
      penggunaan_kuota_per_sesi: [],
    },
  };
}

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
  const admin = getAdminFromRequest(req);
  if (!admin) return fail("Unauthorized", 401);

  try {
    const data = await getDashboardData();
    return ok(data);
  } catch (error) {
    if (isMissingTableError(error)) {
      return ok(getEmptyDashboard());
    }
    return fail("Failed to load dashboard", 500);
  }
}
