import { Request, Response } from 'express';
import { checkDatabaseConnection } from '../lib/prisma';
import { env } from '../config/env';
import { sendSuccess } from '../utils/response';

export async function getHealth(_req: Request, res: Response): Promise<void> {
  const isDbConnected = await checkDatabaseConnection();

  const healthData = {
    status: isDbConnected ? 'healthy' : 'degraded',
    database: isDbConnected ? 'connected' : 'disconnected',
    demoMode: env.DEMO_MODE,
    uptimeSec: Math.floor(process.uptime()),
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    notice: !isDbConnected
      ? 'Database is currently unreachable. Demo data mode is active.'
      : undefined,
  };

  sendSuccess(res, healthData, 200, {
    database: isDbConnected ? 'connected' : 'disconnected',
  });
}
