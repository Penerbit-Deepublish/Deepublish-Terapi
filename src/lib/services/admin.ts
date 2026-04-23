import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { Prisma } from "@prisma/client";
import { addDays, formatDateOnly, parseDateOnly, startOfTodayUtc } from "@/lib/services/date";
import { getQuotaByDate } from "@/lib/services/booking";
import type { z } from "zod";
import { updatePesertaSchema } from "@/lib/validators/admin";
import { getAdminInstansiScope, type AdminRole } from "@/lib/admin-roles";
import type { Instansi } from "@/lib/kepesertaan";
import { getMaxBookingPerGenderPerSession, getMaxBookingPerSession } from "@/lib/quota";

function getEffectiveSessionCapacityPerInstansi(kapasitas: number) {
  void kapasitas;
  return getMaxBookingPerSession("Deepublish");
}

function normalizeJam(value: string) {
  return value.replaceAll(".", ":").replace(/\s*-\s*/g, " - ").trim();
}

function buildInstansiScopeWhere(role?: AdminRole): Prisma.TerapiWhereInput {
  const instansi = getAdminInstansiScope(role);
  return instansi ? { instansi } : {};
}

function assertRoleCanAccessInstansi(role: AdminRole | undefined, instansi: string) {
  const scopedInstansi = getAdminInstansiScope(role);
  if (scopedInstansi && scopedInstansi !== instansi) {
    throw new Error("FORBIDDEN_INSTANSI");
  }
}

export async function getDashboardData(input?: { from?: string; to?: string; role?: AdminRole }) {
  const today = startOfTodayUtc();
  const rangeEnd = input?.to ? parseDateOnly(input.to) : today;
  const rangeStart = input?.from ? parseDateOnly(input.from) : addDays(rangeEnd, -6);
  if (rangeEnd < rangeStart) {
    throw new Error("INVALID_DATE_RANGE");
  }
  const monthStart = new Date(Date.UTC(rangeEnd.getUTCFullYear(), rangeEnd.getUTCMonth(), 1));
  const todayString = formatDateOnly(rangeEnd);
  const isFiltered = Boolean(input?.from || input?.to);
  const scopedWhere = buildInstansiScopeWhere(input?.role);

  const [monthlyCount, todayQuota, sessions, weekBookings, todayBookings] = await Promise.all([
    prisma.terapi.count({
      where: isFiltered
        ? { ...scopedWhere, tanggalTerapi: { gte: rangeStart, lte: rangeEnd } }
        : { ...scopedWhere, createdAt: { gte: monthStart } },
    }),
    getQuotaByDate(todayString),
    prisma.sesi.findMany({ orderBy: { jam: "asc" } }),
    prisma.terapi.findMany({
      where: { ...scopedWhere, tanggalTerapi: { gte: rangeStart, lte: rangeEnd } },
      select: { tanggalTerapi: true },
    }),
    prisma.terapi.findMany({
      where: { ...scopedWhere, tanggalTerapi: rangeEnd },
      select: { jamSesi: true, jenisKelamin: true },
    }),
  ]);

  const dailyMap = new Map<string, number>();
  let cursor = new Date(rangeStart);
  while (cursor <= rangeEnd) {
    dailyMap.set(formatDateOnly(cursor), 0);
    cursor = addDays(cursor, 1);
  }
  for (const row of weekBookings) {
    const key = formatDateOnly(row.tanggalTerapi);
    dailyMap.set(key, (dailyMap.get(key) || 0) + 1);
  }

  const todayMap = todayBookings.reduce<Record<string, { total: number; laki: number; wanita: number }>>((acc, item) => {
    acc[item.jamSesi] = acc[item.jamSesi] || { total: 0, laki: 0, wanita: 0 };
    acc[item.jamSesi].total += 1;
    if (item.jenisKelamin === "L") acc[item.jamSesi].laki += 1;
    if (item.jenisKelamin === "P") acc[item.jamSesi].wanita += 1;
    return acc;
  }, {});

  const instansiScope = getAdminInstansiScope(input?.role);
  const quotaScope = instansiScope ?? "ALL";
  const kapasitasTotal = getMaxBookingPerSession(quotaScope);
  const kapasitasPerGender = getMaxBookingPerGenderPerSession(quotaScope);

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
        const usage = todayMap[item.id] || { total: 0, laki: 0, wanita: 0 };
        const terpakai = usage.total;
        return {
          sesi_id: item.id,
          jam: item.jam,
          terpakai,
          terpakai_laki: usage.laki,
          terpakai_wanita: usage.wanita,
          kapasitas_total: kapasitasTotal,
          kapasitas_laki: kapasitasPerGender,
          kapasitas_wanita: kapasitasPerGender,
          sisa: Math.max(0, kapasitasTotal - terpakai),
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
  if (to < from) {
    throw new Error("INVALID_DATE_RANGE");
  }

  const [rows, bookingsByDate] = await Promise.all([
    prisma.kuota.findMany({
      where: { tanggal: { gte: from, lte: to } },
      orderBy: { tanggal: "asc" },
      select: { id: true, tanggal: true, kuotaMax: true },
    }),
    prisma.terapi.groupBy({
      by: ["tanggalTerapi"],
      where: { tanggalTerapi: { gte: from, lte: to } },
      _count: { _all: true },
    }),
  ]);

  const bookedMap = new Map(
    bookingsByDate.map((row) => [formatDateOnly(row.tanggalTerapi), row._count._all] as const),
  );

  return rows.map((item) => {
    const tanggal = formatDateOnly(item.tanggal);
    const kuotaTerpakai = bookedMap.get(tanggal) ?? 0;
    return {
      id: item.id,
      tanggal,
      kuota_max: item.kuotaMax,
      kuota_terpakai: kuotaTerpakai,
      sisa: Math.max(0, item.kuotaMax - kuotaTerpakai),
    };
  });
}

export async function deleteKuotaByTanggal(tanggalString: string) {
  const tanggal = parseDateOnly(tanggalString);
  return prisma.$transaction(async (tx) => {
    const kuota = await tx.kuota.findUnique({ where: { tanggal } });
    if (!kuota) return null;

    const bookingCount = await tx.terapi.count({ where: { tanggalTerapi: tanggal } });
    if (bookingCount > 0) {
      throw new Error("QUOTA_HAS_BOOKING");
    }

    await tx.kuota.delete({ where: { id: kuota.id } });
    return { id: kuota.id, tanggal: tanggalString };
  });
}

export async function upsertSesi(input: { id?: string; jam: string; kapasitas: number }) {
  const kapasitas = getEffectiveSessionCapacityPerInstansi(input.kapasitas);
  const sesi = input.id
    ? await prisma.sesi.update({
        where: { id: input.id },
        data: { jam: input.jam, kapasitas },
      })
    : await prisma.sesi.create({
        data: { jam: input.jam, kapasitas },
      });

  return {
    id: sesi.id,
    jam: sesi.jam,
    kapasitas: getEffectiveSessionCapacityPerInstansi(sesi.kapasitas),
    terisi: sesi.terisi,
  };
}

export async function listSesi() {
  const data = await prisma.sesi.findMany({ orderBy: { jam: "asc" } });
  return data.map((item) => ({
    id: item.id,
    jam: item.jam,
    kapasitas: getEffectiveSessionCapacityPerInstansi(item.kapasitas),
    terisi: item.terisi,
  }));
}

export async function listPeserta(
  page: number,
  pageSize: number,
  q?: string,
  dateFrom?: string,
  dateTo?: string,
  role?: AdminRole,
) {
  const where: Prisma.TerapiWhereInput = buildInstansiScopeWhere(role);
  const scopedInstansi = getAdminInstansiScope(role);
  if (q) {
    where.OR = [
      { namaLengkap: { contains: q, mode: "insensitive" } },
      { departemen: { contains: q, mode: "insensitive" } },
      { instansi: { contains: q, mode: "insensitive" } },
      { statusKepesertaan: { contains: q, mode: "insensitive" } },
    ];
  }
  if (dateFrom || dateTo) {
    const from = dateFrom ? parseDateOnly(dateFrom) : undefined;
    const to = dateTo ? parseDateOnly(dateTo) : undefined;
    where.tanggalTerapi = {
      ...(from ? { gte: from } : {}),
      ...(to ? { lte: to } : {}),
    };
  }
  const whereClause = Object.keys(where).length > 0 ? where : undefined;

  const offset = (page - 1) * pageSize;
  const sqlConditions: Prisma.Sql[] = [];
  if (scopedInstansi) {
    sqlConditions.push(Prisma.sql`t.instansi = ${scopedInstansi}`);
  }
  if (q) {
    const needle = `%${q}%`;
    sqlConditions.push(Prisma.sql`(
      t.nama_lengkap ILIKE ${needle}
      OR t.departemen ILIKE ${needle}
      OR t.instansi ILIKE ${needle}
      OR t.status_kepesertaan ILIKE ${needle}
    )`);
  }
  if (dateFrom) {
    sqlConditions.push(Prisma.sql`t.tanggal_terapi >= ${parseDateOnly(dateFrom)}`);
  }
  if (dateTo) {
    sqlConditions.push(Prisma.sql`t.tanggal_terapi <= ${parseDateOnly(dateTo)}`);
  }
  const whereSql = sqlConditions.length > 0
    ? Prisma.sql`WHERE ${Prisma.join(sqlConditions, Prisma.sql` AND `)}`
    : Prisma.empty;

  const [total, rows, sessions] = await Promise.all([
    prisma.terapi.count({ where: whereClause }),
    prisma.$queryRaw<
      Array<{
        id: string;
        nama_lengkap: string;
        tanggal_terapi: Date;
        jam_sesi: string;
        departemen: string | null;
        instansi: string;
        status_kepesertaan: string | null;
        tanggal_lahir: Date | null;
        jenis_kelamin: "L" | "P";
        keluhan_luar: string[];
        keluhan_luar_lainnya: string | null;
        keluhan_dalam: string[];
        keluhan_dalam_lainnya: string | null;
        paket: "LENGKAP" | "SEBAGIAN";
        created_at: Date;
      }>
    >(Prisma.sql`
      SELECT
        t.id,
        t.nama_lengkap,
        t.tanggal_terapi,
        t.jam_sesi,
        t.departemen,
        t.instansi,
        t.status_kepesertaan,
        t.tanggal_lahir,
        t.jenis_kelamin,
        t.keluhan_luar,
        t.keluhan_luar_lainnya,
        t.keluhan_dalam,
        t.keluhan_dalam_lainnya,
        t.paket,
        t.created_at
      FROM "terapi"."terapi" t
      LEFT JOIN "terapi"."sesi" s
        ON t.jam_sesi = s.id::text OR t.jam_sesi = s.jam
      ${whereSql}
      ORDER BY
        t.tanggal_terapi DESC,
        substring(replace(COALESCE(s.jam, t.jam_sesi), '.', ':') from 1 for 5) ASC,
        t.created_at DESC
      OFFSET ${offset}
      LIMIT ${pageSize}
    `),
    prisma.sesi.findMany({ select: { id: true, jam: true } }),
  ]);

  const sessionMap = new Map(sessions.map((item) => [item.id, item.jam]));
  const sessionIdByJam = new Map(sessions.map((item) => [normalizeJam(item.jam), item.id]));

  return {
    page,
    pageSize,
    total,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
    items: rows.map((item) => {
      const normalizedStoredJam = normalizeJam(item.jam_sesi);
      const resolvedSesiId = sessionMap.has(item.jam_sesi)
        ? item.jam_sesi
        : (sessionIdByJam.get(normalizedStoredJam) ?? "");
      return ({
      id: item.id,
      nama_lengkap: item.nama_lengkap,
      tanggal_terapi: formatDateOnly(item.tanggal_terapi),
      sesi_id: resolvedSesiId,
      departemen: item.departemen,
      instansi: item.instansi as Instansi,
      status_kepesertaan: item.status_kepesertaan,
      tanggal_lahir: item.tanggal_lahir ? formatDateOnly(item.tanggal_lahir) : null,
      jenis_kelamin: item.jenis_kelamin,
      jam_kehadiran: sessionMap.get(resolvedSesiId) || item.jam_sesi,
      keluhan_luar: item.keluhan_luar,
      keluhan_luar_lainnya: item.keluhan_luar_lainnya,
      keluhan_dalam: item.keluhan_dalam,
      keluhan_dalam_lainnya: item.keluhan_dalam_lainnya,
      paket: item.paket,
      created_at: item.created_at.toISOString(),
    });
    }),
  };
}

function buildKeluhanCombined(input: {
  keluhan_luar: string[];
  keluhan_luar_lainnya?: string;
  keluhan_dalam: string[];
  keluhan_dalam_lainnya?: string;
}) {
  return [
    ...input.keluhan_luar,
    ...(input.keluhan_luar_lainnya?.trim() ? [`Yang lain (luar): ${input.keluhan_luar_lainnya.trim()}`] : []),
    ...input.keluhan_dalam,
    ...(input.keluhan_dalam_lainnya?.trim() ? [`Yang lain (dalam): ${input.keluhan_dalam_lainnya.trim()}`] : []),
  ];
}

export async function updatePeserta(id: string, input: z.infer<typeof updatePesertaSchema>, role?: AdminRole) {
  const tanggalTerapi = parseDateOnly(input.tanggal_terapi);
  const tanggalLahir = parseDateOnly(input.tanggal_lahir);
  const rawSesiInput = input.sesi_id.trim();
  const normalizedSesiInput = normalizeJam(rawSesiInput);

  return prisma.$transaction(async (tx) => {
    const existing = await tx.terapi.findUnique({
      where: { id },
      select: { id: true, tanggalTerapi: true, jamSesi: true, jenisKelamin: true, instansi: true },
    });
    if (!existing) {
      return null;
    }
    assertRoleCanAccessInstansi(role, existing.instansi);
    assertRoleCanAccessInstansi(role, input.instansi);

    const [quota, sessionById, sessionByJam] = await Promise.all([
      tx.kuota.findUnique({
        where: { tanggal: tanggalTerapi },
        select: { id: true, kuotaMax: true },
      }),
      tx.sesi.findUnique({
        where: { id: rawSesiInput },
        select: { id: true, jam: true, kapasitas: true },
      }),
      tx.sesi.findFirst({
        where: { jam: normalizedSesiInput },
        select: { id: true, jam: true, kapasitas: true },
      }),
    ]);
    const session = sessionById || sessionByJam;

    if (!session) {
      throw new Error("SESI_NOT_FOUND");
    }
    if (!quota) {
      throw new Error("SCHEDULE_NOT_FOUND");
    }

    const [sessionBookings, sameGenderSessionBookings, dailyBookings] = await Promise.all([
      tx.terapi.count({
        where: {
          id: { not: id },
          tanggalTerapi,
          jamSesi: session.id,
          instansi: input.instansi,
        },
      }),
      tx.terapi.count({
        where: {
          id: { not: id },
          tanggalTerapi,
          jamSesi: session.id,
          jenisKelamin: input.jenis_kelamin,
          instansi: input.instansi,
        },
      }),
      tx.terapi.count({
        where: {
          id: { not: id },
          tanggalTerapi,
        },
      }),
    ]);

    if (sessionBookings >= getMaxBookingPerSession(input.instansi)) {
      throw new Error("SESI_FULL");
    }
    if (sameGenderSessionBookings >= getMaxBookingPerGenderPerSession(input.instansi)) {
      throw new Error("GENDER_QUOTA_FULL");
    }
    if (dailyBookings >= quota.kuotaMax) {
      throw new Error("QUOTA_FULL");
    }

    const updated = await tx.terapi.update({
      where: { id },
      data: {
        namaLengkap: input.nama_lengkap,
        departemen: input.departemen.trim() || null,
        instansi: input.instansi,
        statusKepesertaan: input.status_kepesertaan,
        tanggalTerapi,
        tanggalLahir,
        jenisKelamin: input.jenis_kelamin,
        paket: input.paket,
        jamSesi: session.id,
        keluhanLuar: input.keluhan_luar,
        keluhanLuarLainnya: input.keluhan_luar_lainnya?.trim() || null,
        keluhanDalam: input.keluhan_dalam,
        keluhanDalamLainnya: input.keluhan_dalam_lainnya?.trim() || null,
        keluhan: buildKeluhanCombined(input),
      },
    });

    const previousDate = formatDateOnly(existing.tanggalTerapi);
    const nextDate = input.tanggal_terapi;
    if (previousDate !== nextDate) {
      const previousQuota = await tx.kuota.findUnique({ where: { tanggal: existing.tanggalTerapi } });
      if (previousQuota && previousQuota.kuotaTerpakai > 0) {
        await tx.kuota.update({
          where: { id: previousQuota.id },
          data: { kuotaTerpakai: { decrement: 1 } },
        });
      }

      await tx.kuota.update({
        where: { id: quota.id },
        data: { kuotaTerpakai: { increment: 1 } },
      });
    }

    if (existing.jamSesi !== session.id) {
      const previousSesi = await tx.sesi.findUnique({ where: { id: existing.jamSesi } });
      if (previousSesi && previousSesi.terisi > 0) {
        await tx.sesi.update({
          where: { id: previousSesi.id },
          data: { terisi: { decrement: 1 } },
        });
      }
      await tx.sesi.update({
        where: { id: session.id },
        data: { terisi: { increment: 1 } },
      });
    }

    return {
      id: updated.id,
      nama_lengkap: updated.namaLengkap,
      tanggal_terapi: formatDateOnly(updated.tanggalTerapi),
      sesi_id: updated.jamSesi,
      jam_kehadiran: session.jam,
      departemen: updated.departemen,
      instansi: updated.instansi as Instansi,
      status_kepesertaan: updated.statusKepesertaan,
      tanggal_lahir: updated.tanggalLahir ? formatDateOnly(updated.tanggalLahir) : null,
      jenis_kelamin: updated.jenisKelamin,
      keluhan_luar: updated.keluhanLuar,
      keluhan_luar_lainnya: updated.keluhanLuarLainnya,
      keluhan_dalam: updated.keluhanDalam,
      keluhan_dalam_lainnya: updated.keluhanDalamLainnya,
      paket: updated.paket,
      created_at: updated.createdAt.toISOString(),
    };
  });
}

export async function deletePeserta(id: string, role?: AdminRole) {
  return prisma.$transaction(async (tx) => {
    const existing = await tx.terapi.findUnique({ where: { id } });
    if (!existing) {
      return null;
    }
    assertRoleCanAccessInstansi(role, existing.instansi);

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

export async function listPengguna(
  page: number,
  pageSize: number,
  q?: string,
  _dateFrom?: string,
  _dateTo?: string,
) {
  const where: Prisma.AdminUserWhereInput = {};
  if (q) {
    where.email = { contains: q, mode: "insensitive" };
  }
  const whereClause = Object.keys(where).length > 0 ? where : undefined;

  const [total, rows] = await Promise.all([
    prisma.adminUser.count({ where: whereClause }),
    prisma.adminUser.findMany({
      where: whereClause,
      orderBy: { email: "asc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
      select: { id: true, email: true, role: true },
    }),
  ]);

  return {
    page,
    pageSize,
    total,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
    items: rows.map((item) => ({
      id: item.id,
      email: item.email,
      role: item.role,
    })),
  };
}

export async function createPengguna(input: { email: string; role: AdminRole; password: string }) {
  const passwordHash = await bcrypt.hash(input.password, 10);
  const user = await prisma.adminUser.create({
    data: {
      email: input.email.toLowerCase(),
      role: input.role,
      passwordHash,
    },
    select: { id: true, email: true, role: true },
  });

  return user;
}

export async function updatePengguna(id: string, input: { email?: string; role?: AdminRole; password?: string }) {
  const data: {
    email?: string;
    role?: AdminRole;
    passwordHash?: string;
  } = {};

  if (input.email) {
    data.email = input.email.toLowerCase();
  }
  if (input.role) {
    data.role = input.role;
  }
  if (input.password) {
    data.passwordHash = await bcrypt.hash(input.password, 10);
  }

  const updated = await prisma.adminUser.update({
    where: { id },
    data,
    select: { id: true, email: true, role: true },
  });

  return updated;
}

export async function deletePengguna(id: string, currentAdminId?: string) {
  if (currentAdminId && currentAdminId === id) {
    throw new Error("CANNOT_DELETE_SELF");
  }

  const existing = await prisma.adminUser.findUnique({
    where: { id },
    select: { id: true },
  });
  if (!existing) {
    return null;
  }

  await prisma.adminUser.delete({ where: { id } });
  return { id };
}
