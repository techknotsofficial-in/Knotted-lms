import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();

async function main() {
  const users = await db.user.findMany();
  console.log("Current users in database:", users.map(u => ({ id: u.id, email: u.email, role: u.role, name: u.name })));
}

main().finally(async () => {
  await db.$disconnect();
});
