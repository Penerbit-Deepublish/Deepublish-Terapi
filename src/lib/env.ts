export const AUTH_COOKIE = "terapi_admin_token";

export function getEnv(name: string): string {
  const value = process.env[name];
  if (!value || value.trim().length === 0) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

export function getJwtTtl(): string {
  return process.env.JWT_EXPIRES_IN || "12h";
}
