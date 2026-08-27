import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();

async function main() {
  const targetEmail = process.argv[2];

  if (targetEmail) {
    const updated = await db.user.updateMany({
      where: { email: { equals: targetEmail, mode: "insensitive" } },
      data: { role: "ADMIN" },
    });
    console.log(`✅ Updated ${updated.count} user(s) with email '${targetEmail}' to role ADMIN.`);
  } else {
    // Promote all existing accounts to ADMIN for development ease
    const updated = await db.user.updateMany({
      data: { role: "ADMIN" },
    });
    console.log(`✅ Promoted all ${updated.count} users in the database to role ADMIN.`);
  }

  const allUsers = await db.user.findMany({ select: { id: true, email: true, role: true } });
  console.log("\nUpdated Database Users & Roles:", allUsers);
}

main().finally(async () => {
  await db.$disconnect();
});
