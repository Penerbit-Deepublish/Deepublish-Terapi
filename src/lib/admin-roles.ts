import type { Instansi } from "@/lib/kepesertaan";

export const ADMIN_ROLE_OPTIONS = ["super", "deepublishadmin", "imbsadmin"] as const;

export type AdminRole = (typeof ADMIN_ROLE_OPTIONS)[number];

export function isAdminRole(value: unknown): value is AdminRole {
  if (typeof value !== "string") return false;
  return ADMIN_ROLE_OPTIONS.includes(value as AdminRole);
}

export function getAdminInstansiScope(role?: string): Instansi | undefined {
  if (role === "deepublishadmin") return "Deepublish";
  if (role === "imbsadmin") return "IMBS";
  return undefined;
}
