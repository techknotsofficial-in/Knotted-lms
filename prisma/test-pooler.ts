import { PrismaClient } from "@prisma/client";

const db = new PrismaClient({
  datasources: {
    db: {
      url: "postgresql://postgres.hznmqygbwzruxabvhbjc:TechKnotsDb@aws-0-ap-northeast-1.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=25&pool_timeout=30",
    },
  },
});

async function main() {
  const start = Date.now();
  const courses = await db.course.findMany({ select: { id: true, title: true, isPublished: true } });
  console.log(`⚡ Connected to Supabase PgBouncer (Port 6543) in ${Date.now() - start}ms:`, courses);
}

main().finally(async () => {
  await db.$disconnect();
});
