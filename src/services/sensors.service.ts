import { prisma, checkDatabaseConnection } from '../lib/prisma';
import { demoStore } from './demoStore';
import { getPrimaryDevice } from './device.service';
import { HistorySensorQuery } from '../schemas/sensors.schema';
import { DataSource } from '@prisma/client';

export async function getLatestSensorReadingService(deviceId?: string) {
  const isConnected = await checkDatabaseConnection();

  if (!isConnected) {
    const demo = demoStore.getLatestReading();
    return {
      reading: {
        id: demo.id,
        deviceId: demo.deviceId,
        distanceCm: demo.distanceCm,
        fillPercent: demo.fillPercent,
        dataSource: demo.dataSource,
        isSimulated: true,
        recordedAt: demo.recordedAt,
      },
      isDatabaseConnected: false,
    };
  }

  try {
    const { device } = await getPrimaryDevice(deviceId);

    const reading = await prisma.sensorReading.findFirst({
      where: { deviceId: device.id },
      orderBy: { recordedAt: 'desc' },
    });

    if (!reading) {
      // If no reading in database yet, return demo reading explicitly marked as simulated
      const demo = demoStore.getLatestReading();
      return {
        reading: {
          id: demo.id,
          deviceId: device.id,
          distanceCm: demo.distanceCm,
          fillPercent: demo.fillPercent,
          dataSource: 'SIMULATED' as const,
          isSimulated: true,
          recordedAt: demo.recordedAt,
        },
        isDatabaseConnected: true,
      };
    }

    return {
      reading: {
        id: reading.id,
        deviceId: reading.deviceId,
        distanceCm: reading.distanceCm,
        fillPercent: reading.fillPercent,
        dataSource: reading.dataSource,
        isSimulated: reading.dataSource === DataSource.SIMULATED,
        recordedAt: reading.recordedAt.toISOString(),
      },
      isDatabaseConnected: true,
    };
  } catch (err) {
    console.warn('Database query failed in getLatestSensorReadingService, falling back:', err);
    const demo = demoStore.getLatestReading();
    return {
      reading: demo,
      isDatabaseConnected: false,
    };
  }
}

export async function getSensorHistoryService(query: HistorySensorQuery) {
  const isConnected = await checkDatabaseConnection();

  if (!isConnected) {
    const all = demoStore.getHistory(query.from, query.to);
    const total = all.length;
    const page = query.page;
    const limit = query.limit;
    const totalPages = Math.ceil(total / limit) || 1;
    const skip = (page - 1) * limit;
    const paginated = all.slice(skip, skip + limit);

    return {
      data: paginated,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
      isDatabaseConnected: false,
    };
  }

  try {
    const { device } = await getPrimaryDevice(query.deviceId);

    const where: any = {
      deviceId: device.id,
    };

    if (query.dataSource && query.dataSource !== 'ALL') {
      where.dataSource = query.dataSource as DataSource;
    }

    if (query.from || query.to) {
      where.recordedAt = {};
      if (query.from) {
        where.recordedAt.gte = new Date(query.from);
      }
      if (query.to) {
        // If YYYY-MM-DD, include the entire day
        const toDate =
          query.to.length === 10
            ? new Date(new Date(query.to).getTime() + 86_400_000)
            : new Date(query.to);
        where.recordedAt.lte = toDate;
      }
    }

    const total = await prisma.sensorReading.count({ where });
    const page = query.page;
    const limit = query.limit;
    const totalPages = Math.ceil(total / limit) || 1;
    const skip = (page - 1) * limit;

    const readings = await prisma.sensorReading.findMany({
      where,
      orderBy: { recordedAt: 'desc' },
      skip,
      take: limit,
    });

    // If database has 0 readings yet (empty DB before any readings or seed), provide demo history fallback
    if (total === 0) {
      const demoAll = demoStore.getHistory(query.from, query.to);
      const demoTotal = demoAll.length;
      const demoTotalPages = Math.ceil(demoTotal / limit) || 1;
      const demoPaginated = demoAll.slice(skip, skip + limit);

      return {
        data: demoPaginated,
        pagination: {
          page,
          limit,
          total: demoTotal,
          totalPages: demoTotalPages,
          hasNext: page < demoTotalPages,
          hasPrev: page > 1,
        },
        isDatabaseConnected: true,
      };
    }

    const formatted = readings.map((r) => ({
      id: r.id,
      deviceId: r.deviceId,
      distanceCm: r.distanceCm,
      fillPercent: r.fillPercent,
      dataSource: r.dataSource,
      isSimulated: r.dataSource === DataSource.SIMULATED,
      recordedAt: r.recordedAt.toISOString(),
    }));

    return {
      data: formatted,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
      isDatabaseConnected: true,
    };
  } catch (err) {
    console.warn('Database query failed in getSensorHistoryService, falling back:', err);
    const all = demoStore.getHistory(query.from, query.to);
    const total = all.length;
    const page = query.page;
    const limit = query.limit;
    const totalPages = Math.ceil(total / limit) || 1;
    const skip = (page - 1) * limit;
    const paginated = all.slice(skip, skip + limit);

    return {
      data: paginated,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
      isDatabaseConnected: false,
    };
  }
}
