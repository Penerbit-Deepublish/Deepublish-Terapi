import { prisma } from "@/lib/prisma";
import type { Instansi } from "@/lib/kepesertaan";
import { getMaxBookingPerGenderPerSession, getMaxBookingPerSession } from "@/lib/quota";

export interface ResolvedSesiQuota {
  jadwalId: string | null;
  instansiQuotaId: string | null;
  kuotaMax: number;
  kapasitasLaki: number;
  kapasitasWanita: number;
  kuotaTerpakai: number;
}

export function getDefaultSesiQuota(instansi?: Instansi): ResolvedSesiQuota {
  const scope = instansi ?? "Deepublish";
  const kapasitasLaki = getMaxBookingPerGenderPerSession(scope);
  const kapasitasWanita = getMaxBookingPerGenderPerSession(scope);
  return {
    jadwalId: null,
    instansiQuotaId: null,
    kuotaMax: getMaxBookingPerSession(scope),
    kapasitasLaki,
    kapasitasWanita,
    kuotaTerpakai: 0,
  };
}

export async function getSesiQuotaBaseMap(instansi?: Instansi) {
  const scope = instansi ?? "Deepublish";
  const rows = await prisma.sesiInstansiQuota.findMany({
    where: { instansi: scope },
    select: {
      id: true,
      sesiId: true,
      kuotaMax: true,
      kapasitasLaki: true,
      kapasitasWanita: true,
    },
  });

  return new Map(
    rows.map((row) => [
      row.sesiId,
      {
        instansiQuotaId: row.id,
        kuotaMax: row.kuotaMax,
        kapasitasLaki: row.kapasitasLaki,
        kapasitasWanita: row.kapasitasWanita,
      },
    ] as const),
  );
}

export async function getSesiQuotaOverridesMap(tanggal: Date, instansi?: Instansi) {
  const scope = instansi ?? "Deepublish";
  const rows = await prisma.jadwalTerapi.findMany({
    where: { tanggal, instansi: scope },
    select: {
      id: true,
      sesiId: true,
      kuotaMax: true,
      kapasitasLaki: true,
      kapasitasWanita: true,
      kuotaTerpakai: true,
    },
  });

  return new Map(
    rows.map((row) => [
      row.sesiId,
      {
        jadwalId: row.id,
        instansiQuotaId: null,
        kuotaMax: row.kuotaMax,
        kapasitasLaki: row.kapasitasLaki,
        kapasitasWanita: row.kapasitasWanita,
        kuotaTerpakai: row.kuotaTerpakai,
      } satisfies ResolvedSesiQuota,
    ] as const),
  );
}

export function resolveSesiQuota(
  baseQuotas: Map<string, Omit<ResolvedSesiQuota, "jadwalId" | "kuotaTerpakai"> & { instansiQuotaId: string }>,
  overrides: Map<string, ResolvedSesiQuota>,
  sesiId: string,
  instansi?: Instansi,
): ResolvedSesiQuota {
  const override = overrides.get(sesiId);
  if (override) {
    const base = baseQuotas.get(sesiId);
    return {
      ...override,
      instansiQuotaId: base?.instansiQuotaId ?? null,
    };
  }

  const base = baseQuotas.get(sesiId);
  if (base) {
    return {
      jadwalId: null,
      instansiQuotaId: base.instansiQuotaId,
      kuotaMax: base.kuotaMax,
      kapasitasLaki: base.kapasitasLaki,
      kapasitasWanita: base.kapasitasWanita,
      kuotaTerpakai: 0,
    };
  }

  return getDefaultSesiQuota(instansi);
}
