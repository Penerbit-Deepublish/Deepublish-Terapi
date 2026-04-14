import { NextRequest } from "next/server";
import { AUTH_COOKIE, extractBearerToken, verifyAdminToken } from "@/lib/auth";

export function getAdminFromRequest(req: NextRequest) {
  const bearer = extractBearerToken(req.headers.get("authorization"));
  const cookieToken = req.cookies.get(AUTH_COOKIE)?.value;
  const token = bearer || cookieToken;
  if (!token) return null;
  return verifyAdminToken(token);
}
