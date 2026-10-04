import pg from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../../generated/prisma/client.js";
import { env } from "../config/env.js";

const pool = new pg.Pool({
  connectionString: env.DATABASE_URL,
  max: 30,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});

const adapter = new PrismaPg(pool);

export const prisma = new PrismaClient({ adapter });

/**
 * Mengambil metrik koneksi database PostgreSQL pool.
 */
export function getPoolMetrics(): { totalCount: number; idleCount: number; waitingCount: number } {
  return {
    totalCount: pool.totalCount ?? 0,
    idleCount: pool.idleCount ?? 0,
    waitingCount: pool.waitingCount ?? 0,
  };
}

export async function closeDatabase(): Promise<void> {
  await prisma.$disconnect();
  await pool.end();
}
