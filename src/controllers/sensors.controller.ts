import { Request, Response, NextFunction } from 'express';
import {
  getLatestSensorReadingService,
  getSensorHistoryService,
} from '../services/sensors.service';
import { LatestSensorQuery, HistorySensorQuery } from '../schemas/sensors.schema';
import { sendSuccess, sendPaginated } from '../utils/response';

export async function getLatestSensorReading(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const query = req.query as unknown as LatestSensorQuery;
    const result = await getLatestSensorReadingService(query.deviceId);

    sendSuccess(res, result.reading, 200, {
      isDatabaseConnected: result.isDatabaseConnected,
      dataSource: result.reading.dataSource,
    });
  } catch (error) {
    next(error);
  }
}

export async function getSensorHistory(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const query = req.query as unknown as HistorySensorQuery;
    const result = await getSensorHistoryService(query);

    sendPaginated(res, result.data, result.pagination, 200, {
      isDatabaseConnected: result.isDatabaseConnected,
    });
  } catch (error) {
    next(error);
  }
}
