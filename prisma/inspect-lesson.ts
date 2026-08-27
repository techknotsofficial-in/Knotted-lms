import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();

async function main() {
  const course = await db.course.findUnique({
    where: { slug: "server-foundation-0183" },
    include: {
      chapters: {
        include: {
          lessons: true,
        },
      },
    },
  });

  console.log("Server Foundation Course Data:", JSON.stringify(course, null, 2));
}

main().finally(async () => {
  await db.$disconnect();
});
