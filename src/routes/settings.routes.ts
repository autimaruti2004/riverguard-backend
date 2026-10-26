import { Router } from 'express';
import {
  getSettings,
  updateSettings,
} from '../controllers/settings.controller';
import { validate } from '../middleware/validate';
import {
  getSettingsQuerySchema,
  updateSettingsBodySchema,
} from '../schemas/settings.schema';

const router = Router();

router.get('/', validate({ query: getSettingsQuerySchema }), getSettings);
router.patch('/', validate({ body: updateSettingsBodySchema }), updateSettings);

export default router;
