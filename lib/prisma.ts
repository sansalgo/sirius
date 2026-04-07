import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/prisma/client";

// On Vercel (serverless), DATABASE_URL should point to a connection pooler
// (e.g. Supabase/Neon pgBouncer on port 6543). DIRECT_URL is used for migrations.
// In local dev both can be the same direct connection string.
const connectionString = process.env.DATABASE_URL!;

const adapter = new PrismaPg({
  connectionString,
  // Limit pool size for serverless environments where each invocation
  // gets its own process and we don't want to exhaust DB connections.
  max: process.env.NODE_ENV === "production" ? 1 : 10,
});

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });

// Prevent multiple instances during hot-reload in dev
if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
