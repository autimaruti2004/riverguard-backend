import { PrismaClient, DeviceConnectionStatus } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Primary RiverGuard demo device
  const device = await prisma.device.upsert({
    where: { identifier: 'RGRD-001' },
    update: {},
    create: {
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
    include: {
      settings: true,
    },
  });

  console.log(`✅ Default device ready: ${device.name} [${device.identifier}]`);
  console.log(`   Settings: depth=${device.settings?.basketDepthCm}cm, threshold=${device.settings?.nearFullThresholdPct}% / ${device.settings?.fullThresholdPct}%`);
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
