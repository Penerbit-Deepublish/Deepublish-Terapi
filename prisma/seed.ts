import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  await prisma.$executeRawUnsafe('CREATE SCHEMA IF NOT EXISTS "terapi"');

  const adminEmail = process.env.ADMIN_EMAIL || "admin@terapi.local";
  const adminPassword = process.env.ADMIN_PASSWORD || "admin123";

  const passwordHash = await bcrypt.hash(adminPassword, 10);
  await prisma.adminUser.upsert({
    where: { email: adminEmail },
    update: { passwordHash },
    create: { email: adminEmail, passwordHash },
  });

  const defaultSessions = [
    { jam: "09:00 - 10:00", kapasitas: 4 },
    { jam: "10:00 - 11:00", kapasitas: 4 },
    { jam: "11:00 - 12:00", kapasitas: 4 },
    { jam: "13:00 - 14:00", kapasitas: 4 },
    { jam: "14:00 - 15:00", kapasitas: 4 },
    { jam: "15:00 - 16:00", kapasitas: 4 },
  ];

  for (const sesi of defaultSessions) {
    await prisma.sesi.upsert({
      where: { jam: sesi.jam },
      update: { kapasitas: sesi.kapasitas },
      create: sesi,
    });
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
