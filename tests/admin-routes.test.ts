import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

vi.mock("@/app/api/_utils/auth", () => ({
  getAdminFromRequest: vi.fn(),
}));
vi.mock("@/lib/services/admin", () => ({
  getDashboardData: vi.fn(),
  setKuotaRange: vi.fn(),
  listKuota: vi.fn(),
  upsertSesi: vi.fn(),
  listSesi: vi.fn(),
  listPeserta: vi.fn(),
  deletePeserta: vi.fn(),
}));

import { getAdminFromRequest } from "@/app/api/_utils/auth";
import { GET as dashboardGet } from "@/app/api/admin/dashboard/route";
import { GET as pesertaGet } from "@/app/api/admin/peserta/route";
import { POST as kuotaPost } from "@/app/api/admin/kuota/route";
import { DELETE as pesertaDelete } from "@/app/api/admin/peserta/[id]/route";
import { getDashboardData, listPeserta, setKuotaRange, deletePeserta } from "@/lib/services/admin";

const authMock = vi.mocked(getAdminFromRequest);
const dashboardMock = vi.mocked(getDashboardData);
const listPesertaMock = vi.mocked(listPeserta);
const setKuotaMock = vi.mocked(setKuotaRange);
const deletePesertaMock = vi.mocked(deletePeserta);

describe("admin routes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 when dashboard unauthorized", async () => {
    authMock.mockReturnValueOnce(null);
    const req = new NextRequest("http://localhost/api/admin/dashboard");
    const res = await dashboardGet(req);
    expect(res.status).toBe(401);
  });

  it("returns peserta list with pagination", async () => {
    authMock.mockReturnValueOnce({ sub: "1", email: "a", role: "super" });
    listPesertaMock.mockResolvedValueOnce({ page: 1, pageSize: 10, total: 1, totalPages: 1, items: [] });

    const req = new NextRequest("http://localhost/api/admin/peserta?page=1&pageSize=10");
    const res = await pesertaGet(req);
    expect(res.status).toBe(200);
  });

  it("returns empty dashboard when table is missing", async () => {
    authMock.mockReturnValueOnce({ sub: "1", email: "a", role: "super" });
    dashboardMock.mockRejectedValueOnce(new Error('relation "terapi.terapi" does not exist'));

    const req = new NextRequest("http://localhost/api/admin/dashboard");
    const res = await dashboardGet(req);
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.data.stats.total_peserta_bulan_ini).toBe(0);
  });

  it("validates kuota payload", async () => {
    authMock.mockReturnValueOnce({ sub: "1", email: "a", role: "super" });

    const req = new NextRequest("http://localhost/api/admin/kuota", {
      method: "POST",
      body: JSON.stringify({ kuota_max: 10 }),
      headers: { "content-type": "application/json" },
    });

    const res = await kuotaPost(req);
    expect(res.status).toBe(422);
    expect(setKuotaMock).not.toHaveBeenCalled();
  });

  it("deletes peserta by id", async () => {
    authMock.mockReturnValueOnce({ sub: "1", email: "a", role: "super" });
    deletePesertaMock.mockResolvedValueOnce({ id: "abc" });

    const req = new NextRequest("http://localhost/api/admin/peserta/abc", { method: "DELETE" });
    const res = await pesertaDelete(req, { params: Promise.resolve({ id: "abc" }) } as never);
    expect(res.status).toBe(200);
  });
});
