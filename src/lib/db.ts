import { PrismaClient } from "@prisma/client";

declare global {
  // eslint-disable-next-line no-var
  var cachedPrisma: PrismaClient | undefined;
}

const connectionUrl =
  process.env.DATABASE_URL ||
  "postgresql://postgres.hznmqygbwzruxabvhbjc:TechKnotsDb@aws-0-ap-northeast-1.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=30&pool_timeout=30";

export const db =
  globalThis.cachedPrisma ??
  new PrismaClient({
    datasourceUrl: connectionUrl,
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalThis.cachedPrisma = db;
}

export default db;
