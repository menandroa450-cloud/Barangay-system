
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  // Default accounts for capstone demo
  const defaults = [
    { username: "admin", password: "admin123", role: "admin" },
    { username: "employee", password: "employee123", role: "employee" },
  ];

  for (const acc of defaults) {
    const existing = await prisma.credential.findUnique({ where: { username: acc.username } });
    if (existing) continue;

    const passwordHash = await bcrypt.hash(acc.password, 10);
    await prisma.credential.create({
      data: {
        username: acc.username,
        passwordHash,
        role: acc.role,
      },
    });
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
    console.log("Seed complete.");
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
