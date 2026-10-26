import { Request, Response, NextFunction } from 'express';
import {
  getSettingsService,
  updateSettingsService,
} from '../services/settings.service';
import {
  GetSettingsQuery,
  UpdateSettingsInput,
} from '../schemas/settings.schema';
import { sendSuccess } from '../utils/response';

export async function getSettings(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const query = req.query as unknown as GetSettingsQuery;
    const result = await getSettingsService(query.deviceId);

    sendSuccess(res, result.settings, 200, {
      isDatabaseConnected: result.isDatabaseConnected,
    });
  } catch (error) {
    next(error);
  }
}

export async function updateSettings(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const body = req.body as UpdateSettingsInput;
    const result = await updateSettingsService(body);

    sendSuccess(res, result.settings, 200, {
      isDatabaseConnected: result.isDatabaseConnected,
    });
  } catch (error) {
    next(error);
  }
}
