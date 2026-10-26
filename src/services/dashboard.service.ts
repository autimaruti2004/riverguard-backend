import { checkDatabaseConnection } from '../lib/prisma';
import { getPrimaryDevice } from './device.service';
import { getSettingsService } from './settings.service';
import { getLatestSensorReadingService, getSensorHistoryService } from './sensors.service';
import { getCollectionsService } from './collections.service';

export function computeFillStatus(fillPct: number, nearFull: number, full: number): 'ok' | 'near-full' | 'full' {
  if (fillPct >= full) return 'full';
  if (fillPct >= nearFull) return 'near-full';
  return 'ok';
}

export async function getDashboardSummaryService(deviceId?: string) {
  const isConnected = await checkDatabaseConnection();

  const [deviceResult, settingsResult, latestReadingResult, historyResult, collectionsResult] =
    await Promise.all([
      getPrimaryDevice(deviceId),
      getSettingsService(deviceId),
      getLatestSensorReadingService(deviceId),
      getSensorHistoryService({ page: 1, limit: 30, dataSource: 'ALL' }),
      getCollectionsService({ page: 1, limit: 5 }),
    ]);

  const { device } = deviceResult;
  const { settings } = settingsResult;
  const { reading: latestReading } = latestReadingResult;
  const recentReadings = historyResult.data;
  const recentCollections = collectionsResult.data;

  const currentFill = latestReading?.fillPercent ?? 0;
  const fillStatus = computeFillStatus(
    currentFill,
    settings.nearFullThresholdPct,
    settings.fullThresholdPct
  );

  // 24-hour calculations
  const now = Date.now();
  const past24hTime = now - 24 * 60 * 60 * 1000;
  const readings24h = recentReadings.filter((r) => new Date(r.recordedAt).getTime() >= past24hTime);
  const averageFill24h =
    readings24h.length > 0
      ? parseFloat(
          (readings24h.reduce((acc, cur) => acc + cur.fillPercent, 0) / readings24h.length).toFixed(1)
        )
      : currentFill;

  const lastCollection = recentCollections.length > 0 ? recentCollections[0] : null;

  return {
    device: {
      id: device.id,
      name: device.name,
      identifier: device.identifier,
      status: isConnected ? device.status : 'SIMULATED',
      lastSeenAt: device.lastSeenAt ? new Date(device.lastSeenAt).toISOString() : null,
      firmwareVersion: isConnected ? 'v1.0.0-rc1' : 'N/A – demo mode',
      sensorModel: isConnected ? 'HC-SR04' : 'HC-SR04 (simulated)',
    },
    settings,
    latestReading,
    recentReadings,
    recentCollections,
    summary: {
      currentFillPercent: currentFill,
      status: fillStatus,
      totalCollections: collectionsResult.pagination.total,
      lastCollectionAt: lastCollection ? lastCollection.recordedAt : null,
      readingsCount24h: readings24h.length,
      averageFill24h,
    },
    meta: {
      isDatabaseConnected: isConnected,
      dataSource: isConnected ? 'database' : 'simulated_fallback',
      notice: !isConnected
        ? 'Backend is operating in controlled demo fallback mode. No PostgreSQL instance connected.'
        : undefined,
    },
  };
}
