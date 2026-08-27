import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();

async function main() {
  const users = await db.user.findMany();
  console.log("Current Users in DB:");
  for (const u of users) {
    console.log(`- ${u.name || u.email} (${u.id}) | Image: ${u.image}`);
  }
}

main().finally(async () => {
  await db.$disconnect();
});
