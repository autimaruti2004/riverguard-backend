// ─── Controlled Demo Store for Development / Offline Mode ───────────────────────
// ALL data here is strictly identified as simulated.
// It is NEVER persisted to the database as real sensor measurements.

export interface DemoSensorReading {
  id: string;
  deviceId: string;
  distanceCm: number;
  fillPercent: number;
  dataSource: 'SIMULATED';
  isSimulated: true;
  recordedAt: string;
}

export interface DemoCollectionEvent {
  id: string;
  deviceId: string;
  fillPercentAtCollection: number;
  notes: string | null;
  eventType: 'DEMO' | 'REAL';
  isDemo?: boolean;
  recordedAt: string;
}

export interface DemoSettings {
  basketDepthCm: number;
  nearFullThresholdPct: number;
  fullThresholdPct: number;
  pollingIntervalSec: number;
}

export const DEMO_DEVICE = {
  id: 'dev_demo_001',
  name: 'RiverGuard Unit 01 (Demo Basket)',
  identifier: 'RGRD-001',
  status: 'SIMULATED' as const,
  lastSeenAt: new Date().toISOString(),
  createdAt: '2026-10-01T00:00:00.000Z',
  updatedAt: new Date().toISOString(),
};

let currentSettings: DemoSettings = {
  basketDepthCm: 20,
  nearFullThresholdPct: 80,
  fullThresholdPct: 95,
  pollingIntervalSec: 5,
};

function generateInitialReadings(): DemoSensorReading[] {
  const baseTime = new Date('2026-10-24T13:00:00+05:30').getTime();
  const depth = currentSettings.basketDepthCm;
  const distances = [
    18.0, 17.5, 17.2, 16.8, 16.4, 16.0, 15.5, 15.0,
    14.6, 14.2, 13.9, 13.5, 13.0, 12.5, 12.0, 11.6,
    11.2, 10.8, 10.4, 10.1,  9.8,  9.5,  9.2,  8.9,
    8.6,  8.3,  8.0,  7.8,  7.6,  7.4,  7.2,  7.0,
    6.9,  6.8,  6.7,  6.6,  6.5,  6.4,  6.3,  6.2,
    6.1,  6.0,  5.9,  5.8,  5.7,  5.6,  5.5,  5.4,
  ];

  return distances.map((dist, i) => {
    const ts = new Date(baseTime - (distances.length - 1 - i) * 30 * 60 * 1000);
    const fill = Math.min(100, Math.max(0, ((depth - dist) / depth) * 100));
    return {
      id: `SIM-${String(i + 1).padStart(3, '0')}`,
      deviceId: DEMO_DEVICE.id,
      distanceCm: dist,
      fillPercent: parseFloat(fill.toFixed(1)),
      dataSource: 'SIMULATED' as const,
      isSimulated: true as const,
      recordedAt: ts.toISOString(),
    };
  });
}

let readings: DemoSensorReading[] = generateInitialReadings();

let collectionEvents: DemoCollectionEvent[] = [
  {
    id: 'COL-001',
    deviceId: DEMO_DEVICE.id,
    fillPercentAtCollection: 92,
    notes: 'Demo collection recorded in event log. Basket reset to 0%. (Does not claim physical waste removal.)',
    eventType: 'DEMO',
    recordedAt: '2026-10-22T09:15:00.000Z',
  },
  {
    id: 'COL-002',
    deviceId: DEMO_DEVICE.id,
    fillPercentAtCollection: 88,
    notes: 'Demo collection recorded in event log. Basket reset to 0%. (Does not claim physical waste removal.)',
    eventType: 'DEMO',
    recordedAt: '2026-10-23T14:30:00.000Z',
  },
];

export const demoStore = {
  getDevice() {
    return { ...DEMO_DEVICE };
  },

  getSettings(): DemoSettings {
    return { ...currentSettings };
  },

  updateSettings(patch: Partial<DemoSettings>): DemoSettings {
    currentSettings = { ...currentSettings, ...patch };
    return { ...currentSettings };
  },

  getLatestReading(): DemoSensorReading {
    if (readings.length === 0) {
      readings = generateInitialReadings();
    }
    const last = readings[readings.length - 1];
    return {
      ...last,
      // Fresh timestamp
      recordedAt: new Date().toISOString(),
    };
  },

  getHistory(from?: string, to?: string): DemoSensorReading[] {
    let result = [...readings];
    if (from) {
      const fromTime = new Date(from).getTime();
      result = result.filter((r) => new Date(r.recordedAt).getTime() >= fromTime);
    }
    if (to) {
      const toTime = new Date(to).getTime() + (to.length === 10 ? 86_400_000 : 0);
      result = result.filter((r) => new Date(r.recordedAt).getTime() <= toTime);
    }
    return result;
  },

  addSimulatedReading(distanceCm: number): DemoSensorReading {
    const depth = currentSettings.basketDepthCm;
    const fill = Math.min(100, Math.max(0, ((depth - distanceCm) / depth) * 100));
    const newReading: DemoSensorReading = {
      id: `SIM-LIVE-${Date.now()}`,
      deviceId: DEMO_DEVICE.id,
      distanceCm: parseFloat(distanceCm.toFixed(2)),
      fillPercent: parseFloat(fill.toFixed(1)),
      dataSource: 'SIMULATED',
      isSimulated: true,
      recordedAt: new Date().toISOString(),
    };
    readings.push(newReading);
    if (readings.length > 300) {
      readings = readings.slice(-300);
    }
    return newReading;
  },

  getCollections(from?: string, to?: string): DemoCollectionEvent[] {
    let result = [...collectionEvents];
    if (from) {
      const fromTime = new Date(from).getTime();
      result = result.filter((c) => new Date(c.recordedAt).getTime() >= fromTime);
    }
    if (to) {
      const toTime = new Date(to).getTime() + (to.length === 10 ? 86_400_000 : 0);
      result = result.filter((c) => new Date(c.recordedAt).getTime() <= toTime);
    }
    return result;
  },

  recordCollection(fillPercentAtCollection: number, notes?: string): DemoCollectionEvent {
    const id = `COL-${String(collectionEvents.length + 1).padStart(3, '0')}`;
    const disclaimer =
      notes ||
      'Collection confirmed and recorded in system log. Basket monitoring level reset. (Event logging only; does not claim physical waste removal.)';
    const event: DemoCollectionEvent = {
      id,
      deviceId: DEMO_DEVICE.id,
      fillPercentAtCollection,
      notes: disclaimer,
      eventType: 'DEMO',
      recordedAt: new Date().toISOString(),
    };
    collectionEvents.unshift(event);

    // Reset simulated basket fill by adding a reset reading
    this.addSimulatedReading(currentSettings.basketDepthCm);

    return event;
  },
};
