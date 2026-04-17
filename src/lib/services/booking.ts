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

export interface BookingDateAvailability {
  tanggal: string;
  kuota_max: number;
  kuota_terpakai: number;
  sisa: number;
}

interface QuotaSnapshot {
  id?: string;
  tanggal: string;
  kuota_max: number;
  kuota_terpakai: number;
  sisa: number;
}

const DEFAULT_SESSION_TIMES = [
  "09:00 - 10:00",
  "10:00 - 11:00",
  "11:00 - 12:00",
  "13:00 - 14:00",
  "14:00 - 15:00",
  "15:00 - 16:00",
] as const;

const MAX_BOOKING_PER_SESSION = 3;
const DEFAULT_SESSION_CAPACITY = MAX_BOOKING_PER_SESSION;

function normalizeJam(value: string) {
  return value.replaceAll(".", ":").replace(/\s*-\s*/g, " - ").trim();
}

async function ensureDefaultSessions() {
  const existing = await prisma.sesi.findMany({ select: { jam: true } });
  const normalizedExisting = new Set(existing.map((item) => normalizeJam(item.jam)));
  const missing = DEFAULT_SESSION_TIMES.filter((jam) => !normalizedExisting.has(normalizeJam(jam)));

  if (missing.length === 0) return;

  await prisma.sesi.createMany({
    data: missing.map((jam) => ({ jam, kapasitas: DEFAULT_SESSION_CAPACITY })),
    skipDuplicates: true,
  });
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
  await ensureDefaultSessions();

  const [sessions, bookings] = await Promise.all([
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

  return sessions.map((s) => {
    const terisiTanggal = bookedMap[s.id] ?? 0;

    return {
      id: s.id,
      jam: s.jam,
      kapasitas: MAX_BOOKING_PER_SESSION,
      terisi: terisiTanggal,
      tersedia: terisiTanggal < MAX_BOOKING_PER_SESSION,
    };
  });
}

export async function getBookingDateAvailability(): Promise<BookingDateAvailability[]> {
  const today = startOfTodayUtc();
  const rows = await prisma.kuota.findMany({
    where: { tanggal: { gte: today } },
    orderBy: { tanggal: "asc" },
    take: 180,
    select: { tanggal: true, kuotaMax: true },
  });

  if (rows.length === 0) {
    return [];
  }

  const from = rows[0].tanggal;
  const to = rows[rows.length - 1].tanggal;

  const bookingsByDate = await prisma.terapi.groupBy({
    by: ["tanggalTerapi"],
    where: { tanggalTerapi: { gte: from, lte: to } },
    _count: { _all: true },
  });

  const bookedMap = new Map(
    bookingsByDate.map((item) => [formatDateOnly(item.tanggalTerapi), item._count._all] as const),
  );

  return rows
    .map((item) => {
      const tanggalKey = formatDateOnly(item.tanggal);
      const kuotaTerpakai = bookedMap.get(tanggalKey) ?? 0;
      return {
        tanggal: tanggalKey,
        kuota_max: item.kuotaMax,
        kuota_terpakai: kuotaTerpakai,
        sisa: Math.max(0, item.kuotaMax - kuotaTerpakai),
      };
    });
}

export async function createBooking(input: BookingApiInput) {
  const tanggal = parseDateOnly(
    input.tanggal_terapi ?? process.env.DEFAULT_TANGGAL_TERAPI ?? formatDateOnly(startOfTodayUtc()),
  );
  const tanggalLahir = parseDateOnly(input.tanggal_lahir);
  const lokasiTerapi =
    input.lokasi_terapi?.trim() ||
    process.env.DEFAULT_LOKASI_TERAPI ||
    "Klinik Utama Bio Elektrik Deepublish";

  return prisma.$transaction(async (tx) => {
    const [session, existingQuota, sessionBookings, dailyBookings] = await Promise.all([
      tx.sesi.findUnique({ where: { id: input.sesi_id } }),
      tx.kuota.findUnique({ where: { tanggal } }),
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

    if (sessionBookings >= MAX_BOOKING_PER_SESSION) {
      throw new Error("SESI_FULL");
    }

    const quotaMax = existingQuota?.kuotaMax ?? 0;
    const quotaTerpakai = dailyBookings;

    if (!existingQuota) {
      throw new Error("SCHEDULE_NOT_FOUND");
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
