ALTER TABLE "terapi"."admin_users"
ADD COLUMN IF NOT EXISTS "username" TEXT NOT NULL DEFAULT 'Admin';
