import { describe, expect, it, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

vi.mock("@/lib/services/booking", () => ({
  createBooking: vi.fn(),
  getQuotaByDate: vi.fn(),
  getSesiAvailability: vi.fn(),
}));

import { POST as postTerapi } from "@/app/api/terapi/route";
import { GET as getQuota } from "@/app/api/terapi/quota/route";
import { GET as getSesi } from "@/app/api/terapi/sesi/route";
import { createBooking, getQuotaByDate, getSesiAvailability } from "@/lib/services/booking";

const createBookingMock = vi.mocked(createBooking);
const getQuotaMock = vi.mocked(getQuotaByDate);
const getSesiMock = vi.mocked(getSesiAvailability);

describe("terapi routes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("rejects invalid booking payload", async () => {
    const req = new NextRequest("http://localhost/api/terapi", {
      method: "POST",
      body: JSON.stringify({ nama_lengkap: "A" }),
      headers: { "content-type": "application/json" },
    });

    const res = await postTerapi(req);
    expect(res.status).toBe(422);
  });

  it("returns 409 when quota is full", async () => {
    createBookingMock.mockRejectedValueOnce(new Error("QUOTA_FULL"));

    const req = new NextRequest("http://localhost/api/terapi", {
      method: "POST",
      body: JSON.stringify({
        nama_lengkap: "Nama Pasien",
        departemen: "Produksi",
        status_kepesertaan: "KARYAWAN",
        tanggal_terapi: "2026-04-20",
        tanggal_lahir: "1990-01-01",
        jenis_kelamin: "L",
        paket: "LENGKAP",
        keluhan_luar: ["Stroke"],
        keluhan_dalam: [],
        sesi_id: "550e8400-e29b-41d4-a716-446655440000",
      }),
      headers: { "content-type": "application/json" },
    });

    const res = await postTerapi(req);
    expect(res.status).toBe(409);
  });

  it("loads quota by date", async () => {
    getQuotaMock.mockResolvedValueOnce({
      tanggal: "2026-04-13",
      kuota_max: 10,
      kuota_terpakai: 3,
      sisa: 7,
    });

    const req = new NextRequest("http://localhost/api/terapi/quota?tanggal=2026-04-13");
    const res = await getQuota(req);
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.data.sisa).toBe(7);
  });

  it("loads sesi availability", async () => {
    getSesiMock.mockResolvedValueOnce([
      { id: "1", jam: "09:00", kapasitas: 5, terisi: 3, tersedia: true },
    ]);

    const req = new NextRequest("http://localhost/api/terapi/sesi?tanggal=2026-04-13");
    const res = await getSesi(req);
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.data[0].tersedia).toBe(true);
  });
});
