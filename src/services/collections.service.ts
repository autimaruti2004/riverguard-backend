import { prisma, checkDatabaseConnection } from '../lib/prisma';
import { demoStore } from './demoStore';
import { getPrimaryDevice } from './device.service';
import { CreateCollectionInput, QueryCollectionsQuery } from '../schemas/collections.schema';
import { EventType, DataSource } from '@prisma/client';

export interface CollectionEventDto {
  id: string;
  deviceId: string;
  fillPercentAtCollection: number;
  notes: string | null;
  eventType: 'REAL' | 'DEMO' | EventType;
  isDemo: boolean;
  recordedAt: string;
  notice?: string;
}

export async function getCollectionsService(query: QueryCollectionsQuery): Promise<{
  data: CollectionEventDto[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
  isDatabaseConnected: boolean;
}> {
  const isConnected = await checkDatabaseConnection();

  if (!isConnected) {
    const all = demoStore.getCollections(query.from, query.to);
    const total = all.length;
    const page = query.page;
    const limit = query.limit;
    const totalPages = Math.ceil(total / limit) || 1;
    const skip = (page - 1) * limit;
    const paginated = all.slice(skip, skip + limit).map((e) => ({
      ...e,
      isDemo: true,
    }));

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

    if (query.from || query.to) {
      where.recordedAt = {};
      if (query.from) {
        where.recordedAt.gte = new Date(query.from);
      }
      if (query.to) {
        const toDate =
          query.to.length === 10
            ? new Date(new Date(query.to).getTime() + 86_400_000)
            : new Date(query.to);
        where.recordedAt.lte = toDate;
      }
    }

    const total = await prisma.collectionEvent.count({ where });
    const page = query.page;
    const limit = query.limit;
    const totalPages = Math.ceil(total / limit) || 1;
    const skip = (page - 1) * limit;

    const events = await prisma.collectionEvent.findMany({
      where,
      orderBy: { recordedAt: 'desc' },
      skip,
      take: limit,
    });

    if (total === 0) {
      // Fallback demo collections if DB empty
      const demoAll = demoStore.getCollections(query.from, query.to);
      const demoTotal = demoAll.length;
      const demoTotalPages = Math.ceil(demoTotal / limit) || 1;
      const demoPaginated = demoAll.slice(skip, skip + limit).map((e) => ({
        ...e,
        isDemo: true,
      }));

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

    const formatted: CollectionEventDto[] = events.map((e) => ({
      id: e.id,
      deviceId: e.deviceId,
      fillPercentAtCollection: e.fillPercentAtCollection,
      notes: e.notes,
      eventType: e.eventType,
      isDemo: e.eventType === EventType.DEMO,
      recordedAt: e.recordedAt.toISOString(),
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
    console.warn('Database query failed in getCollectionsService, falling back:', err);
    const all = demoStore.getCollections(query.from, query.to);
    const total = all.length;
    const page = query.page;
    const limit = query.limit;
    const totalPages = Math.ceil(total / limit) || 1;
    const skip = (page - 1) * limit;
    const paginated = all.slice(skip, skip + limit).map((e) => ({
      ...e,
      isDemo: true,
    }));

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

export async function recordCollectionService(input: CreateCollectionInput): Promise<{
  event: CollectionEventDto;
  isDatabaseConnected: boolean;
}> {
  const isConnected = await checkDatabaseConnection();

  const standardNote =
    input.notes?.trim() ||
    'Collection confirmed and recorded in system log. Basket monitoring level reset. (Event logging only; does not claim physical waste removal.)';

  if (!isConnected) {
    const event = demoStore.recordCollection(input.fillPercentAtCollection, standardNote);
    return {
      event: {
        ...event,
        isDemo: true,
        notice: 'Collection recorded in system log. (Does not claim physical waste removal.)',
      },
      isDatabaseConnected: false,
    };
  }

  try {
    const { device } = await getPrimaryDevice(input.deviceId);

    // Transaction handling: records collection event and inserts a basket-reset reading
    const result = await prisma.$transaction(async (tx) => {
      // 1. Fetch current settings for basket depth
      const settings = await tx.deviceSettings.findUnique({
        where: { deviceId: device.id },
      });
      const depth = settings?.basketDepthCm ?? 20;

      // 2. Create collection event
      const event = await tx.collectionEvent.create({
        data: {
          deviceId: device.id,
          fillPercentAtCollection: input.fillPercentAtCollection,
          notes: standardNote,
          eventType: input.eventType === 'REAL' ? EventType.REAL : EventType.DEMO,
        },
      });

      // 3. Record reset reading (0% fill, distance = basket depth)
      await tx.sensorReading.create({
        data: {
          deviceId: device.id,
          distanceCm: depth,
          fillPercent: 0,
          dataSource: input.eventType === 'REAL' ? DataSource.REAL : DataSource.SIMULATED,
        },
      });

      return event;
    });

    return {
      event: {
        id: result.id,
        deviceId: result.deviceId,
        fillPercentAtCollection: result.fillPercentAtCollection,
        notes: result.notes,
        eventType: result.eventType,
        isDemo: result.eventType === EventType.DEMO,
        recordedAt: result.recordedAt.toISOString(),
        notice: 'Collection recorded in system log. (Does not claim physical waste removal.)',
      },
      isDatabaseConnected: true,
    };
  } catch (err) {
    console.warn('Database transaction failed in recordCollectionService, falling back:', err);
    const event = demoStore.recordCollection(input.fillPercentAtCollection, standardNote);
    return {
      event: {
        ...event,
        isDemo: true,
        notice: 'Collection recorded in system log. (Does not claim physical waste removal.)',
      },
      isDatabaseConnected: false,
    };
  }
}
