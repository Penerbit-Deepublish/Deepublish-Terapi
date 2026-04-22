import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  await prisma.$executeRawUnsafe('CREATE SCHEMA IF NOT EXISTS "terapi"');

  const adminUsers = [
    {
      name: "Admin IMBS",
      email: "admin@imbs.com",
      role: "imbsadmin",
      password: "AdminIMBS@123",
    },
    {
      name: "Admin Deepublish",
      email: "admin@deepublish.com",
      role: "deepublishadmin",
      password: "Admin@123",
    },
  ];

  if (process.env.ADMIN_EMAIL && process.env.ADMIN_PASSWORD) {
    const envAdminEmail = process.env.ADMIN_EMAIL.toLowerCase();
    const hasEnvAdmin = adminUsers.some((admin) => admin.email === envAdminEmail);
    if (!hasEnvAdmin) {
      adminUsers.push({
        name: process.env.ADMIN_NAME || "Admin",
        email: envAdminEmail,
        role: process.env.ADMIN_ROLE || "super",
        password: process.env.ADMIN_PASSWORD,
      });
    }
  }

  for (const admin of adminUsers) {
    const passwordHash = await bcrypt.hash(admin.password, 10);
    await prisma.adminUser.upsert({
      where: { email: admin.email },
      update: { name: admin.name, role: admin.role, passwordHash },
      create: { name: admin.name, email: admin.email, role: admin.role, passwordHash },
    });
  }

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
