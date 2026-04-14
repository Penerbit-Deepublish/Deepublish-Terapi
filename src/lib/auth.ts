import jwt from "jsonwebtoken";
import { AUTH_COOKIE, getEnv, getJwtTtl } from "@/lib/env";

export interface AdminJwtPayload {
  sub: string;
  email: string;
  role: "admin";
}

function getSecret() {
  return getEnv("JWT_SECRET");
}

export function signAdminToken(payload: AdminJwtPayload): string {
  return jwt.sign(payload, getSecret(), {
    expiresIn: getJwtTtl() as jwt.SignOptions["expiresIn"],
    algorithm: "HS256",
  });
}

export function verifyAdminToken(token: string): AdminJwtPayload | null {
  try {
    const decoded = jwt.verify(token, getSecret());
    if (typeof decoded !== "object" || !decoded) {
      return null;
    }

    const payload = decoded as Partial<AdminJwtPayload>;
    if (!payload.sub || !payload.email || payload.role !== "admin") {
      return null;
    }

    return payload as AdminJwtPayload;
  } catch {
    return null;
  }
}

export function extractBearerToken(headerValue: string | null): string | null {
  if (!headerValue) return null;
  const [scheme, token] = headerValue.split(" ");
  if (scheme?.toLowerCase() !== "bearer" || !token) return null;
  return token;
}

export { AUTH_COOKIE };
