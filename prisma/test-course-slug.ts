import { PrismaClient } from "@prisma/client";

const db = new PrismaClient({
  datasourceUrl: "postgresql://postgres.hznmqygbwzruxabvhbjc:TechKnotsDb@aws-0-ap-northeast-1.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=30&pool_timeout=30",
});

async function main() {
  const start = Date.now();
  const course = await db.course.findUnique({
    where: { slug: "server-foundation-0183" },
    include: {
      instructor: {
        select: { id: true, name: true, image: true, email: true },
      },
      chapters: {
        orderBy: { sortOrder: "asc" },
        include: {
          lessons: {
            orderBy: { sortOrder: "asc" },
          },
        },
      },
    },
  });

  console.log(`⚡ Fetched course [server-foundation-0183] in ${Date.now() - start}ms:`, {
    id: course?.id,
    title: course?.title,
    price: course?.price,
    instructor: course?.instructor?.name || course?.instructor?.email,
    chaptersCount: course?.chapters.length,
  });
}

main().finally(async () => {
  await db.$disconnect();
});
