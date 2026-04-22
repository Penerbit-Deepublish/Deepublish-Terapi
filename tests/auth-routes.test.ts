import { describe, expect, it, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    adminUser: {
      findUnique: vi.fn(),
    },
  },
}));
vi.mock("bcryptjs", () => ({
  default: {
    compare: vi.fn(),
  },
}));
vi.mock("@/lib/auth", async () => {
  const original = await vi.importActual<typeof import("@/lib/auth")>("@/lib/auth");
  return {
    ...original,
    signAdminToken: vi.fn().mockReturnValue("mock-token"),
  };
});

import { POST as loginRoute } from "@/app/api/auth/login/route";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

const findUniqueMock = vi.mocked(prisma.adminUser.findUnique);
const compareMock = vi.mocked(bcrypt.compare);

describe("auth routes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 422 for invalid login body", async () => {
    const req = new NextRequest("http://localhost/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ email: "not-email", password: "" }),
      headers: { "content-type": "application/json" },
    });

    const res = await loginRoute(req);
    expect(res.status).toBe(422);
  });

  it("returns 401 for unknown user", async () => {
    findUniqueMock.mockResolvedValueOnce(null);

    const req = new NextRequest("http://localhost/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ email: "admin@x.com", password: "x" }),
      headers: { "content-type": "application/json" },
    });

    const res = await loginRoute(req);
    expect(res.status).toBe(401);
  });

  it("returns 200 for valid credentials", async () => {
    findUniqueMock.mockResolvedValueOnce({
      id: "1",
      email: "admin@x.com",
      passwordHash: "hash",
    } as never);
    compareMock.mockResolvedValueOnce(true as never);

    const req = new NextRequest("http://localhost/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ email: "admin@x.com", password: "x" }),
      headers: { "content-type": "application/json" },
    });

    const res = await loginRoute(req);
    expect(res.status).toBe(200);
  });
});
