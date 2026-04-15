import { prisma } from "@/lib/prisma";
import { BookingApiInput } from "@/lib/validators/terapi";
import { addDays, formatDateOnly, parseDateOnly, startOfTodayUtc } from "@/lib/services/date";

export interface SessionAvailability {
  id: string;
  jam: string;
  kapasitas: number;
  terisi: number;
  tersedia: boolean;
}

interface QuotaSnapshot {
  id?: string;
  tanggal: string;
  kuota_max: number;
  kuota_terpakai: number;
  sisa: number;
}

async function getQuotaSnapshotsForRange(from: Date, to: Date): Promise<QuotaSnapshot[]> {
  const [sessions, quotas, bookingsByDate] = await Promise.all([
    prisma.sesi.findMany({ select: { kapasitas: true } }),
    prisma.kuota.findMany({
      where: { tanggal: { gte: from, lte: to } },
      select: { id: true, tanggal: true, kuotaMax: true },
    }),
    prisma.terapi.groupBy({
      by: ["tanggalTerapi"],
      where: { tanggalTerapi: { gte: from, lte: to } },
      _count: { _all: true },
    }),
  ]);

  const defaultMax = sessions.reduce((sum, item) => sum + item.kapasitas, 0);
  const quotaMap = new Map(
    quotas.map((item) => [formatDateOnly(item.tanggal), item] as const),
  );
  const bookedMap = new Map(
    bookingsByDate.map((item) => [formatDateOnly(item.tanggalTerapi), item._count._all] as const),
  );

  const snapshots: QuotaSnapshot[] = [];
  let cursor = new Date(from);

  while (cursor <= to) {
    const key = formatDateOnly(cursor);
    const quotaRow = quotaMap.get(key);
    const booked = bookedMap.get(key) ?? 0;
    const kuotaMax = quotaRow?.kuotaMax ?? defaultMax;

    snapshots.push({
      id: quotaRow?.id ?? `generated-${key}`,
      tanggal: key,
      kuota_max: kuotaMax,
      kuota_terpakai: booked,
      sisa: Math.max(0, kuotaMax - booked),
    });

    cursor = addDays(cursor, 1);
  }

  return snapshots;
}

export async function getQuotaByDate(dateString: string) {
  const tanggal = parseDateOnly(dateString);
  const [snapshot] = await getQuotaSnapshotsForRange(tanggal, tanggal);
  return snapshot;
}

export async function getQuotaByRange(dateFrom: string, dateTo: string) {
  const from = parseDateOnly(dateFrom);
  const to = parseDateOnly(dateTo);

  if (to < from) {
    throw new Error("INVALID_DATE_RANGE");
  }

  return getQuotaSnapshotsForRange(from, to);
}

export async function getSesiAvailability(dateString: string): Promise<SessionAvailability[]> {
  const tanggal = parseDateOnly(dateString);
  const today = startOfTodayUtc();

  const [quota, sessions, bookings] = await Promise.all([
    prisma.kuota.findUnique({ where: { tanggal } }),
    prisma.sesi.findMany({ orderBy: { jam: "asc" } }),
    prisma.terapi.findMany({
      where: { tanggalTerapi: tanggal },
      select: { jamSesi: true },
    }),
  ]);

  const bookedMap = bookings.reduce<Record<string, number>>((acc, item) => {
    acc[item.jamSesi] = (acc[item.jamSesi] || 0) + 1;
    return acc;
  }, {});

  const totalBooked = bookings.length;
  const fallbackQuota = sessions.reduce((sum, item) => sum + item.kapasitas, 0);
  const quotaMax = quota?.kuotaMax ?? fallbackQuota;
  const quotaTerpakai = totalBooked;
  const quotaAvailable = Math.max(0, quotaMax - quotaTerpakai);
  const isPastDate = tanggal < today;

  return sessions.map((s) => {
    const terisiTanggal = bookedMap[s.id] ?? 0;
    const slotSisa = Math.max(0, s.kapasitas - terisiTanggal);

    return {
      id: s.id,
      jam: s.jam,
      kapasitas: s.kapasitas,
      terisi: terisiTanggal,
      tersedia: !isPastDate && quotaAvailable > 0 && slotSisa > 0,
    };
  });
}

export async function createBooking(input: BookingApiInput) {
  const tanggal = parseDateOnly(process.env.DEFAULT_TANGGAL_TERAPI ?? formatDateOnly(startOfTodayUtc()));
  const tanggalLahir = parseDateOnly(input.tanggal_lahir);
  const lokasiTerapi =
    input.lokasi_terapi?.trim() ||
    process.env.DEFAULT_LOKASI_TERAPI ||
    "Klinik Utama Bio Elektrik Deepublish";

  return prisma.$transaction(async (tx) => {
    const [session, existingQuota, totalSessionsCapacity, sessionBookings, dailyBookings] = await Promise.all([
      tx.sesi.findUnique({ where: { id: input.sesi_id } }),
      tx.kuota.findUnique({ where: { tanggal } }),
      tx.sesi.aggregate({ _sum: { kapasitas: true } }),
      tx.terapi.count({
        where: {
          tanggalTerapi: tanggal,
          jamSesi: input.sesi_id,
        },
      }),
      tx.terapi.count({
        where: {
          tanggalTerapi: tanggal,
        },
      }),
    ]);

    if (!session) {
      throw new Error("SESI_NOT_FOUND");
    }

    if (sessionBookings >= session.kapasitas) {
      throw new Error("SESI_FULL");
    }

    const fallbackMax = totalSessionsCapacity._sum.kapasitas || 0;
    const quotaMax = existingQuota?.kuotaMax ?? fallbackMax;
    const quotaTerpakai = dailyBookings;

    if (quotaMax <= 0 || quotaTerpakai >= quotaMax) {
      throw new Error("QUOTA_FULL");
    }

    const booking = await tx.terapi.create({
      data: {
        namaLengkap: input.nama_lengkap,
        jenisKelamin: input.jenis_kelamin,
        lokasiTerapi,
        tanggalTerapi: tanggal,
        paket: input.paket,
        jamSesi: input.sesi_id,
        departemen: input.departemen,
        statusKepesertaan: input.status_kepesertaan,
        tanggalLahir,
        keluhanLuar: input.keluhan_luar,
        keluhanLuarLainnya: input.keluhan_luar_lainnya?.trim() || null,
        keluhanDalam: input.keluhan_dalam,
        keluhanDalamLainnya: input.keluhan_dalam_lainnya?.trim() || null,
        // Backward-compatible combined field (used by some existing admin UI/search)
        keluhan: [
          ...input.keluhan_luar,
          ...(input.keluhan_luar_lainnya?.trim() ? [`Yang lain (luar): ${input.keluhan_luar_lainnya.trim()}`] : []),
          ...input.keluhan_dalam,
          ...(input.keluhan_dalam_lainnya?.trim() ? [`Yang lain (dalam): ${input.keluhan_dalam_lainnya.trim()}`] : []),
        ],
      },
    });

    await tx.kuota.upsert({
      where: { tanggal },
      create: {
        tanggal,
        kuotaMax: Math.max(1, quotaMax),
        kuotaTerpakai: quotaTerpakai + 1,
      },
      update: {
        kuotaTerpakai: {
          increment: 1,
        },
      },
    });

    await tx.sesi.update({
      where: { id: session.id },
      data: { terisi: { increment: 1 } },
    });

    return {
      id: booking.id,
      nama_lengkap: booking.namaLengkap,
      tanggal_terapi: formatDateOnly(booking.tanggalTerapi),
      sesi_id: booking.jamSesi,
      paket: booking.paket,
      created_at: booking.createdAt.toISOString(),
    };
  });
}
