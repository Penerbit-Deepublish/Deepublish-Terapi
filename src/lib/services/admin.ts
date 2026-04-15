import { prisma } from "@/lib/prisma";
import { addDays, formatDateOnly, parseDateOnly, startOfTodayUtc } from "@/lib/services/date";
import { getQuotaByDate, getQuotaByRange } from "@/lib/services/booking";

export async function getDashboardData() {
  const today = startOfTodayUtc();
  const monthStart = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), 1));
  const weekStart = addDays(today, -6);
  const todayString = formatDateOnly(today);

  const [monthlyCount, todayQuota, sessions, weekBookings, todayBookings] = await Promise.all([
    prisma.terapi.count({ where: { createdAt: { gte: monthStart } } }),
    getQuotaByDate(todayString),
    prisma.sesi.findMany({ orderBy: { jam: "asc" } }),
    prisma.terapi.findMany({
      where: { tanggalTerapi: { gte: weekStart, lte: today } },
      select: { tanggalTerapi: true },
    }),
    prisma.terapi.findMany({ where: { tanggalTerapi: today }, select: { jamSesi: true } }),
  ]);

  const dailyMap = new Map<string, number>();
  for (let i = 0; i < 7; i += 1) {
    dailyMap.set(formatDateOnly(addDays(weekStart, i)), 0);
  }
  for (const row of weekBookings) {
    const key = formatDateOnly(row.tanggalTerapi);
    dailyMap.set(key, (dailyMap.get(key) || 0) + 1);
  }

  const todayMap = todayBookings.reduce<Record<string, number>>((acc, item) => {
    acc[item.jamSesi] = (acc[item.jamSesi] || 0) + 1;
    return acc;
  }, {});

  return {
    stats: {
      total_peserta_bulan_ini: monthlyCount,
      sisa_kuota_hari_ini: todayQuota.sisa,
      total_sesi_hari_ini: sessions.length,
    },
    charts: {
      tren_reservasi_harian: Array.from(dailyMap.entries()).map(([tanggal, total]) => ({
        tanggal,
        total,
      })),
      penggunaan_kuota_per_sesi: sessions.map((item) => {
        const terpakai = todayMap[item.id] ?? 0;
        return {
          sesi_id: item.id,
          jam: item.jam,
          terpakai,
          sisa: Math.max(0, item.kapasitas - terpakai),
        };
      }),
    },
  };
}

export async function setKuotaRange(input: {
  tanggal?: string;
  tanggal_mulai?: string;
  tanggal_selesai?: string;
  kuota_max: number;
}) {
  const ranges: Date[] = [];
  if (input.tanggal) {
    ranges.push(parseDateOnly(input.tanggal));
  } else {
    const start = parseDateOnly(input.tanggal_mulai!);
    const end = parseDateOnly(input.tanggal_selesai!);
    if (end < start) {
      throw new Error("INVALID_DATE_RANGE");
    }

    let cursor = new Date(start);
    while (cursor <= end) {
      ranges.push(new Date(cursor));
      cursor = addDays(cursor, 1);
    }
  }

  const rangeStart = ranges[0];
  const rangeEnd = ranges[ranges.length - 1];
  const bookingStats = await prisma.terapi.groupBy({
    by: ["tanggalTerapi"],
    where: { tanggalTerapi: { gte: rangeStart, lte: rangeEnd } },
    _count: { _all: true },
  });
  const bookedMap = new Map(
    bookingStats.map((row) => [formatDateOnly(row.tanggalTerapi), row._count._all] as const),
  );

  const upserts = await prisma.$transaction(
    ranges.map((tanggal) =>
      prisma.kuota.upsert({
        where: { tanggal },
        create: {
          tanggal,
          kuotaMax: input.kuota_max,
          kuotaTerpakai: bookedMap.get(formatDateOnly(tanggal)) ?? 0,
        },
        update: {
          kuotaMax: input.kuota_max,
          kuotaTerpakai: bookedMap.get(formatDateOnly(tanggal)) ?? 0,
        },
      }),
    ),
  );

  return upserts.map((item) => ({
    id: item.id,
    tanggal: formatDateOnly(item.tanggal),
    kuota_max: item.kuotaMax,
    kuota_terpakai: item.kuotaTerpakai,
  }));
}

export async function listKuota(dateFrom?: string, dateTo?: string) {
  const today = startOfTodayUtc();
  const from = dateFrom ? parseDateOnly(dateFrom) : today;
  const to = dateTo ? parseDateOnly(dateTo) : addDays(from, 30);
  return getQuotaByRange(formatDateOnly(from), formatDateOnly(to));
}

export async function upsertSesi(input: { id?: string; jam: string; kapasitas: number }) {
  const sesi = input.id
    ? await prisma.sesi.update({
        where: { id: input.id },
        data: { jam: input.jam, kapasitas: input.kapasitas },
      })
    : await prisma.sesi.create({
        data: { jam: input.jam, kapasitas: input.kapasitas },
      });

  return {
    id: sesi.id,
    jam: sesi.jam,
    kapasitas: sesi.kapasitas,
    terisi: sesi.terisi,
  };
}

export async function listSesi() {
  const data = await prisma.sesi.findMany({ orderBy: { jam: "asc" } });
  return data.map((item) => ({
    id: item.id,
    jam: item.jam,
    kapasitas: item.kapasitas,
    terisi: item.terisi,
  }));
}

export async function listPeserta(page: number, pageSize: number, q?: string) {
  const where = q
    ? {
        OR: [
          { namaLengkap: { contains: q, mode: "insensitive" as const } },
          { departemen: { contains: q, mode: "insensitive" as const } },
          { statusKepesertaan: { contains: q, mode: "insensitive" as const } },
        ],
      }
    : undefined;

  const [total, rows, sessions] = await Promise.all([
    prisma.terapi.count({ where }),
    prisma.terapi.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.sesi.findMany({ select: { id: true, jam: true } }),
  ]);

  const sessionMap = new Map(sessions.map((item) => [item.id, item.jam]));

  return {
    page,
    pageSize,
    total,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
    items: rows.map((item) => ({
      id: item.id,
      nama_lengkap: item.namaLengkap,
      departemen: item.departemen,
      status_kepesertaan: item.statusKepesertaan,
      tanggal_lahir: item.tanggalLahir ? formatDateOnly(item.tanggalLahir) : null,
      jenis_kelamin: item.jenisKelamin,
      jam_kehadiran: sessionMap.get(item.jamSesi) || item.jamSesi,
      keluhan_luar: item.keluhanLuar,
      keluhan_luar_lainnya: item.keluhanLuarLainnya,
      keluhan_dalam: item.keluhanDalam,
      keluhan_dalam_lainnya: item.keluhanDalamLainnya,
      paket: item.paket,
      created_at: item.createdAt.toISOString(),
    })),
  };
}

export async function deletePeserta(id: string) {
  return prisma.$transaction(async (tx) => {
    const existing = await tx.terapi.findUnique({ where: { id } });
    if (!existing) {
      return null;
    }

    await tx.terapi.delete({ where: { id } });

    const quota = await tx.kuota.findUnique({ where: { tanggal: existing.tanggalTerapi } });
    if (quota && quota.kuotaTerpakai > 0) {
      await tx.kuota.update({
        where: { id: quota.id },
        data: { kuotaTerpakai: { decrement: 1 } },
      });
    }

    const sesi = await tx.sesi.findUnique({ where: { id: existing.jamSesi } });
    if (sesi && sesi.terisi > 0) {
      await tx.sesi.update({ where: { id: sesi.id }, data: { terisi: { decrement: 1 } } });
    }

    return { id };
  });
}
