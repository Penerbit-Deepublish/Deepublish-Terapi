#!/bin/sh
set -eu

if [ -z "${DATABASE_URL:-}" ]; then
  echo "[entrypoint] ERROR: DATABASE_URL is not set"
  exit 1
fi

echo "[entrypoint] Generating Prisma client"
npx prisma generate

echo "[entrypoint] Running Prisma migrations"
TRIES=0
until npx prisma migrate deploy; do
  TRIES=$((TRIES + 1))
  if [ "$TRIES" -ge 20 ]; then
    echo "[entrypoint] ERROR: Failed to run migrations after ${TRIES} attempts"
    exit 1
  fi
  echo "[entrypoint] Database not ready yet. Retry ${TRIES}/20 in 3s..."
  sleep 3
done

if [ "${SEED_ON_BOOT:-false}" = "true" ]; then
  echo "[entrypoint] Seeding database"
  npm run db:seed
fi

echo "[entrypoint] Starting Next.js"
exec npm run start -- --hostname 0.0.0.0 --port "${PORT:-3000}"
