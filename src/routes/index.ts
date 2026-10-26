import { Router } from 'express';
import healthRoutes from './health.routes';
import dashboardRoutes from './dashboard.routes';
import sensorsRoutes from './sensors.routes';
import collectionsRoutes from './collections.routes';
import settingsRoutes from './settings.routes';

const router = Router();

router.use('/health', healthRoutes);
router.use('/dashboard', dashboardRoutes);
router.use('/sensors', sensorsRoutes);
router.use('/collections', collectionsRoutes);
router.use('/settings', settingsRoutes);

export default router;
