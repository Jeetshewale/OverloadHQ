// ---------------------------------------------------------------
// OverloadHQ – Prisma Client Singleton
// Handles Neon cold-start reconnection.
// ---------------------------------------------------------------

import { PrismaClient } from "@prisma/client";
import { logger } from "./logger";

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    log:
      process.env.NODE_ENV === "development"
        ? ["query", "error", "warn"]
        : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

/**
 * Execute a query with automatic retry for Neon cold-start.
 * Neon free-tier auto-suspends after 5 minutes of inactivity.
 * The first connection attempt may fail; retrying once resolves it.
 */
export async function withRetry<T>(fn: () => Promise<T>, retries = 2): Promise<T> {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      return await fn();
    } catch (error: any) {
      const isConnectionError =
        error?.code === "P1001" ||
        error?.code === "P1002" ||
        error?.message?.includes("Can't reach database server") ||
        error?.message?.includes("Connection terminated unexpectedly");

      if (isConnectionError && attempt < retries) {
        logger.warn(
          { attempt, code: error?.code },
          "Database connection failed (Neon cold start?), retrying..."
        );
        await new Promise((r) => setTimeout(r, 1000 * attempt));
        continue;
      }
      throw error;
    }
  }
  throw new Error("withRetry: exhausted retries");
}

export default prisma;
