import { prisma, checkDatabaseConnection } from '../lib/prisma';
import { demoStore } from './demoStore';
import { DeviceConnectionStatus } from '@prisma/client';

export async function getPrimaryDevice(requestedId?: string) {
  const isConnected = await checkDatabaseConnection();

  if (!isConnected) {
    return {
      device: demoStore.getDevice(),
      isDatabaseConnected: false,
    };
  }

  try {
    let device;
    if (requestedId) {
      device = await prisma.device.findFirst({
        where: { OR: [{ id: requestedId }, { identifier: requestedId }] },
        include: { settings: true },
      });
    } else {
      // Find default device or create it
      device = await prisma.device.findFirst({
        where: { identifier: 'RGRD-001' },
        include: { settings: true },
      });

      if (!device) {
        device = await prisma.device.create({
          data: {
            name: 'RiverGuard Unit 01 (Central Canal)',
            identifier: 'RGRD-001',
            status: DeviceConnectionStatus.SIMULATED,
            lastSeenAt: new Date(),
            settings: {
              create: {
                basketDepthCm: 20,
                nearFullThresholdPct: 80,
                fullThresholdPct: 95,
                pollingIntervalSec: 5,
              },
            },
          },
          include: { settings: true },
        });
      }
    }

    if (!device) {
      return {
        device: demoStore.getDevice(),
        isDatabaseConnected: true,
      };
    }

    return {
      device,
      isDatabaseConnected: true,
    };
  } catch (err) {
    console.warn('Database query failed in getPrimaryDevice, using demoStore fallback:', err);
    return {
      device: demoStore.getDevice(),
      isDatabaseConnected: false,
    };
  }
}
