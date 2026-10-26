import { PrismaClient } from '@prisma/client';

declare global {
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined;
}

export const prisma =
  global.prisma ||
  new PrismaClient({
    log: [], // Suppress noise during offline probe; operational errors handled by errorHandler
  });

if (process.env.NODE_ENV !== 'production') {
  global.prisma = prisma;
}

let cachedConnectionState: boolean | null = null;
let lastCheckTime = 0;
const CHECK_CACHE_TTL_MS = 3000;

/**
 * Checks if the PostgreSQL database is reachable.
 * Never throws — returns true if connection and query succeed, false otherwise.
 * Results are cached for 3 seconds to avoid connection spam on rapid queries.
 */
export async function checkDatabaseConnection(force = false): Promise<boolean> {
  const now = Date.now();
  if (!force && cachedConnectionState !== null && now - lastCheckTime < CHECK_CACHE_TTL_MS) {
    return cachedConnectionState;
  }

  try {
    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('Database ping timeout')), 1000)
    );
    await Promise.race([prisma.$queryRaw`SELECT 1`, timeoutPromise]);
    cachedConnectionState = true;
    lastCheckTime = now;
    return true;
  } catch {
    cachedConnectionState = false;
    lastCheckTime = now;
    return false;
  }
}
