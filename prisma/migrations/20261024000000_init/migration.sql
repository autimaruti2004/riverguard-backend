-- CreateEnum
CREATE TYPE "DeviceConnectionStatus" AS ENUM ('ONLINE', 'OFFLINE', 'SIMULATED');

-- CreateEnum
CREATE TYPE "EventType" AS ENUM ('REAL', 'DEMO');

-- CreateEnum
CREATE TYPE "DataSource" AS ENUM ('REAL', 'SIMULATED');

-- CreateTable
CREATE TABLE "devices" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "identifier" TEXT NOT NULL,
    "status" "DeviceConnectionStatus" NOT NULL DEFAULT 'OFFLINE',
    "lastSeenAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "devices_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sensor_readings" (
    "id" TEXT NOT NULL,
    "deviceId" TEXT NOT NULL,
    "distanceCm" DOUBLE PRECISION NOT NULL,
    "fillPercent" DOUBLE PRECISION NOT NULL,
    "dataSource" "DataSource" NOT NULL DEFAULT 'SIMULATED',
    "recordedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sensor_readings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "collection_events" (
    "id" TEXT NOT NULL,
    "deviceId" TEXT NOT NULL,
    "fillPercentAtCollection" DOUBLE PRECISION NOT NULL,
    "notes" TEXT,
    "eventType" "EventType" NOT NULL DEFAULT 'DEMO',
    "recordedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "collection_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "device_settings" (
    "id" TEXT NOT NULL,
    "deviceId" TEXT NOT NULL,
    "basketDepthCm" DOUBLE PRECISION NOT NULL DEFAULT 20,
    "nearFullThresholdPct" DOUBLE PRECISION NOT NULL DEFAULT 80,
    "fullThresholdPct" DOUBLE PRECISION NOT NULL DEFAULT 95,
    "pollingIntervalSec" INTEGER NOT NULL DEFAULT 5,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "device_settings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "devices_identifier_key" ON "devices"("identifier");

-- CreateIndex
CREATE INDEX "sensor_readings_deviceId_idx" ON "sensor_readings"("deviceId");

-- CreateIndex
CREATE INDEX "sensor_readings_recordedAt_idx" ON "sensor_readings"("recordedAt");

-- CreateIndex
CREATE INDEX "collection_events_deviceId_idx" ON "collection_events"("deviceId");

-- CreateIndex
CREATE INDEX "collection_events_recordedAt_idx" ON "collection_events"("recordedAt");

-- CreateIndex
CREATE UNIQUE INDEX "device_settings_deviceId_key" ON "device_settings"("deviceId");

-- AddForeignKey
ALTER TABLE "sensor_readings" ADD CONSTRAINT "sensor_readings_deviceId_fkey" FOREIGN KEY ("deviceId") REFERENCES "devices"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "collection_events" ADD CONSTRAINT "collection_events_deviceId_fkey" FOREIGN KEY ("deviceId") REFERENCES "devices"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "device_settings" ADD CONSTRAINT "device_settings_deviceId_fkey" FOREIGN KEY ("deviceId") REFERENCES "devices"("id") ON DELETE CASCADE ON UPDATE CASCADE;
