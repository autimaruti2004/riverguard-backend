import { Router } from 'express';
import {
  getCollections,
  createCollection,
} from '../controllers/collections.controller';
import { validate } from '../middleware/validate';
import {
  createCollectionBodySchema,
  queryCollectionsSchema,
} from '../schemas/collections.schema';

const router = Router();

router.get('/', validate({ query: queryCollectionsSchema }), getCollections);
router.post('/', validate({ body: createCollectionBodySchema }), createCollection);

export default router;
