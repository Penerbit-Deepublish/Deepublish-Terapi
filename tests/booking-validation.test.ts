import { describe, expect, it } from "vitest";

import { bookingFormSchema } from "@/lib/schema";
import { bookingApiSchema } from "@/lib/validators/terapi";
import { isDepartemenRequiredForInstansi } from "@/lib/kepesertaan";

function makeFormPayload(overrides: Record<string, unknown> = {}) {
  return {
    namaLengkap: "Nama Pasien",
    departemen: "Produksi",
    instansi: "Deepublish",
    statusKepesertaan: "Karyawan",
    tanggalLahir: new Date("1990-01-01T00:00:00.000Z"),
    jenisKelamin: "L",
    paket: "LENGKAP",
    keluhanLuar: ["Stroke"],
    keluhanLuarLainnya: "",
    keluhanDalam: [],
    keluhanDalamLainnya: "",
    tanggalSesi: "2026-04-25",
    jamSesi: "550e8400-e29b-41d4-a716-446655440000",
    ...overrides,
  };
}

function makeApiPayload(overrides: Record<string, unknown> = {}) {
  return {
    nama_lengkap: "Nama Pasien",
    departemen: "Produksi",
    instansi: "Deepublish",
    status_kepesertaan: "Karyawan",
    tanggal_terapi: "2026-04-25",
    tanggal_lahir: "1990-01-01",
    jenis_kelamin: "L",
    paket: "LENGKAP",
    keluhan_luar: ["Stroke"],
    keluhan_luar_lainnya: "",
    keluhan_dalam: [],
    keluhan_dalam_lainnya: "",
    sesi_id: "550e8400-e29b-41d4-a716-446655440000",
    ...overrides,
  };
}

describe("departemen visibility and validation rules", () => {
  it("requires departemen for Deepublish in booking form schema", () => {
    const parsed = bookingFormSchema.safeParse(
      makeFormPayload({ instansi: "Deepublish", departemen: "" }),
    );

    expect(parsed.success).toBe(false);
  });

  it("does not require departemen for non-Deepublish in booking form schema", () => {
    const parsed = bookingFormSchema.safeParse(
      makeFormPayload({
        instansi: "IMBS",
        statusKepesertaan: "Siswa",
        departemen: "",
      }),
    );

    expect(parsed.success).toBe(true);
  });

  it("requires departemen for Deepublish in booking api schema", () => {
    const parsed = bookingApiSchema.safeParse(
      makeApiPayload({ instansi: "Deepublish", departemen: "" }),
    );

    expect(parsed.success).toBe(false);
  });

  it("does not require departemen for non-Deepublish in booking api schema", () => {
    const parsed = bookingApiSchema.safeParse(
      makeApiPayload({
        instansi: "IMBS",
        status_kepesertaan: "Siswa",
        departemen: "",
      }),
    );

    expect(parsed.success).toBe(true);
  });

  it("matches helper rule for required departemen", () => {
    expect(isDepartemenRequiredForInstansi("Deepublish")).toBe(true);
    expect(isDepartemenRequiredForInstansi("IMBS")).toBe(false);
  });
});
