import { Router } from 'express';
import {
  getLatestSensorReading,
  getSensorHistory,
} from '../controllers/sensors.controller';
import { validate } from '../middleware/validate';
import {
  latestSensorQuerySchema,
  historySensorQuerySchema,
} from '../schemas/sensors.schema';

const router = Router();

router.get('/latest', validate({ query: latestSensorQuerySchema }), getLatestSensorReading);
router.get('/history', validate({ query: historySensorQuerySchema }), getSensorHistory);

export default router;
