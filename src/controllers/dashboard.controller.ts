import { Request, Response, NextFunction } from 'express';
import { getDashboardSummaryService } from '../services/dashboard.service';
import { sendSuccess } from '../utils/response';

export async function getDashboard(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const deviceId = typeof req.query.deviceId === 'string' ? req.query.deviceId : undefined;
    const summary = await getDashboardSummaryService(deviceId);
    sendSuccess(res, summary, 200, summary.meta);
  } catch (error) {
    next(error);
  }
}
