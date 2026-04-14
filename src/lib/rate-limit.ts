const windowMs = 60_000;
const defaultMax = 60;

interface Entry {
  count: number;
  resetAt: number;
}

const hits = new Map<string, Entry>();

function gc(now: number) {
  for (const [key, entry] of hits.entries()) {
    if (entry.resetAt <= now) {
      hits.delete(key);
    }
  }
}

export function checkRateLimit(key: string, maxPerMinute = defaultMax) {
  const now = Date.now();
  gc(now);

  const existing = hits.get(key);
  if (!existing || existing.resetAt <= now) {
    hits.set(key, { count: 1, resetAt: now + windowMs });
    return {
      allowed: true,
      remaining: maxPerMinute - 1,
      retryAfterSec: Math.ceil(windowMs / 1000),
    };
  }

  existing.count += 1;
  const remaining = Math.max(0, maxPerMinute - existing.count);

  return {
    allowed: existing.count <= maxPerMinute,
    remaining,
    retryAfterSec: Math.max(1, Math.ceil((existing.resetAt - now) / 1000)),
  };
}

export function getClientIp(headers: Headers): string {
  const fwd = headers.get("x-forwarded-for");
  if (fwd) {
    return fwd.split(",")[0]?.trim() || "unknown";
  }
  return headers.get("x-real-ip") || "unknown";
}
