import { PrismaClient } from "@prisma/client";

const urls = [
  {
    name: "Supabase Direct (db.hznmqygbwzruxabvhbjc.supabase.co:5432)",
    url: "postgresql://postgres:TechKnotsDb@db.hznmqygbwzruxabvhbjc.supabase.co:5432/postgres",
  },
  {
    name: "Supabase Pooler Port 5432 (aws-0-ap-northeast-1.pooler.supabase.com:5432)",
    url: "postgresql://postgres.hznmqygbwzruxabvhbjc:TechKnotsDb@aws-0-ap-northeast-1.pooler.supabase.com:5432/postgres",
  },
  {
    name: "Supabase Pooler Port 6543 (aws-0-ap-northeast-1.pooler.supabase.com:6543)",
    url: "postgresql://postgres.hznmqygbwzruxabvhbjc:TechKnotsDb@aws-0-ap-northeast-1.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=15&pool_timeout=30",
  },
];

async function testConnection(item: { name: string; url: string }) {
  console.log(`\nTesting connection: ${item.name}...`);
  const client = new PrismaClient({
    datasourceUrl: item.url,
    log: ["error"],
  });

  try {
    const count = await client.course.count();
    console.log(`✅ SUCCESS! ${item.name} connected. Found ${count} courses.`);
    return true;
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`❌ FAILED: ${item.name}`);
    console.error(`   Error: ${msg.split("\n")[0]}`);
    return false;
  } finally {
    await client.$disconnect();
  }
}

async function main() {
  for (const item of urls) {
    await testConnection(item);
  }
}

main();
