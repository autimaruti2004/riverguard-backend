import { prisma, checkDatabaseConnection } from '../lib/prisma';
import { demoStore } from './demoStore';
import { getPrimaryDevice } from './device.service';
import { UpdateSettingsInput } from '../schemas/settings.schema';

export async function getSettingsService(deviceId?: string) {
  const isConnected = await checkDatabaseConnection();

  if (!isConnected) {
    return {
      settings: demoStore.getSettings(),
      isDatabaseConnected: false,
    };
  }

  try {
    const { device } = await getPrimaryDevice(deviceId);

    let settings = await prisma.deviceSettings.findUnique({
      where: { deviceId: device.id },
    });

    if (!settings) {
      settings = await prisma.deviceSettings.create({
        data: {
          deviceId: device.id,
          basketDepthCm: 20,
          nearFullThresholdPct: 80,
          fullThresholdPct: 95,
          pollingIntervalSec: 5,
        },
      });
    }

    return {
      settings: {
        basketDepthCm: settings.basketDepthCm,
        nearFullThresholdPct: settings.nearFullThresholdPct,
        fullThresholdPct: settings.fullThresholdPct,
        pollingIntervalSec: settings.pollingIntervalSec,
        updatedAt: settings.updatedAt.toISOString(),
      },
      isDatabaseConnected: true,
    };
  } catch (err) {
    console.warn('Database query failed in getSettingsService, using demoStore fallback:', err);
    return {
      settings: demoStore.getSettings(),
      isDatabaseConnected: false,
    };
  }
}

export async function updateSettingsService(input: UpdateSettingsInput) {
  const isConnected = await checkDatabaseConnection();

  if (!isConnected) {
    const updated = demoStore.updateSettings({
      ...(input.basketDepthCm !== undefined && { basketDepthCm: input.basketDepthCm }),
      ...(input.nearFullThresholdPct !== undefined && { nearFullThresholdPct: input.nearFullThresholdPct }),
      ...(input.fullThresholdPct !== undefined && { fullThresholdPct: input.fullThresholdPct }),
      ...(input.pollingIntervalSec !== undefined && { pollingIntervalSec: input.pollingIntervalSec }),
    });

    return {
      settings: updated,
      isDatabaseConnected: false,
    };
  }

  try {
    const { device } = await getPrimaryDevice(input.deviceId);

    const updated = await prisma.deviceSettings.upsert({
      where: { deviceId: device.id },
      update: {
        ...(input.basketDepthCm !== undefined && { basketDepthCm: input.basketDepthCm }),
        ...(input.nearFullThresholdPct !== undefined && { nearFullThresholdPct: input.nearFullThresholdPct }),
        ...(input.fullThresholdPct !== undefined && { fullThresholdPct: input.fullThresholdPct }),
        ...(input.pollingIntervalSec !== undefined && { pollingIntervalSec: input.pollingIntervalSec }),
      },
      create: {
        deviceId: device.id,
        basketDepthCm: input.basketDepthCm ?? 20,
        nearFullThresholdPct: input.nearFullThresholdPct ?? 80,
        fullThresholdPct: input.fullThresholdPct ?? 95,
        pollingIntervalSec: input.pollingIntervalSec ?? 5,
      },
    });

    return {
      settings: {
        basketDepthCm: updated.basketDepthCm,
        nearFullThresholdPct: updated.nearFullThresholdPct,
        fullThresholdPct: updated.fullThresholdPct,
        pollingIntervalSec: updated.pollingIntervalSec,
        updatedAt: updated.updatedAt.toISOString(),
      },
      isDatabaseConnected: true,
    };
  } catch (err) {
    console.warn('Database query failed in updateSettingsService, using demoStore fallback:', err);
    const updated = demoStore.updateSettings({
      ...(input.basketDepthCm !== undefined && { basketDepthCm: input.basketDepthCm }),
      ...(input.nearFullThresholdPct !== undefined && { nearFullThresholdPct: input.nearFullThresholdPct }),
      ...(input.fullThresholdPct !== undefined && { fullThresholdPct: input.fullThresholdPct }),
      ...(input.pollingIntervalSec !== undefined && { pollingIntervalSec: input.pollingIntervalSec }),
    });
    return {
      settings: updated,
      isDatabaseConnected: false,
    };
  }
}
