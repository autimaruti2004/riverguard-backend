import { Request, Response, NextFunction } from 'express';
import {
  getCollectionsService,
  recordCollectionService,
} from '../services/collections.service';
import {
  CreateCollectionInput,
  QueryCollectionsQuery,
} from '../schemas/collections.schema';
import { sendSuccess, sendPaginated } from '../utils/response';

export async function getCollections(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const query = req.query as unknown as QueryCollectionsQuery;
    const result = await getCollectionsService(query);

    sendPaginated(res, result.data, result.pagination, 200, {
      isDatabaseConnected: result.isDatabaseConnected,
    });
  } catch (error) {
    next(error);
  }
}

export async function createCollection(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const body = req.body as CreateCollectionInput;
    const result = await recordCollectionService(body);

    sendSuccess(res, result.event, 201, {
      isDatabaseConnected: result.isDatabaseConnected,
      notice: result.event.notice,
    });
  } catch (error) {
    next(error);
  }
}
