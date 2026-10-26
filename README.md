# RiverGuard Backend API

RiverGuard is an environmental IoT and river waste monitoring platform. This service provides the Express + TypeScript REST API and PostgreSQL database layer (managed via Prisma ORM) for monitoring basket fill levels, recording waste collection events, and managing device settings.

---

## Tech Stack

- **Runtime**: Node.js (v18+)
- **Framework**: Express.js
- **Language**: TypeScript
- **Database**: PostgreSQL
- **ORM**: Prisma ORM
- **Validation**: Zod
- **Testing**: Vitest + Supertest

---

## Architecture & Directory Structure

```
backend/
├── prisma/
│   ├── migrations/
│   │   └── 20261024000000_init/
│   │       └── migration.sql      # Initial PostgreSQL migration
│   ├── schema.prisma              # Data models, enums, indexes, relations
│   └── seed.ts                    # Idempotent database seeder
├── src/
│   ├── config/
│   │   └── env.ts                 # Strongly-typed Zod environment validator
│   ├── controllers/               # Request handling & HTTP status formatting
│   │   ├── collections.controller.ts
│   │   ├── dashboard.controller.ts
│   │   ├── health.controller.ts
│   │   ├── sensors.controller.ts
│   │   └── settings.controller.ts
│   ├── lib/
│   │   └── prisma.ts              # Resilient Prisma client & connectivity checker
│   ├── middleware/
│   │   ├── errorHandler.ts        # Centralized error handler
│   │   ├── logger.ts              # HTTP request logger
│   │   └── validate.ts            # Zod validation middleware
│   ├── routes/                    # Versioned REST router (/api/v1/*)
│   ├── schemas/                   # Zod request & query validation schemas
│   ├── services/                  # Business logic & transaction handling
│   │   ├── collections.service.ts
│   │   ├── dashboard.service.ts
│   │   ├── demoStore.ts           # Controlled in-memory demo data store
│   │   ├── device.service.ts
│   │   ├── sensors.service.ts
│   │   └── settings.service.ts
│   ├── utils/
│   │   ├── errors.ts              # Custom operational error classes
│   │   └── response.ts            # Consistent JSON response utilities
│   ├── app.ts                     # Express app setup & middleware pipeline
│   └── server.ts                  # Server entrypoint & graceful shutdown
├── tests/                         # Vitest route and validation test suite
├── .env.example                   # Environment variable template
├── package.json
└── tsconfig.json
```

---

## Data Models & Schema

The system models the physical waste collection basket and ultrasonic distance sensor (HC-SR04):

1. **`Device`**:
   - Represents a physical collection basket and sensor unit.
   - Fields: `id` (CUID), `name`, `identifier` (unique, e.g. `RGRD-001`), `status` (`ONLINE`, `OFFLINE`, `SIMULATED`), `lastSeenAt`, `createdAt`, `updatedAt`.
2. **`SensorReading`**:
   - One distance measurement and derived fill percentage.
   - Fields: `id`, `deviceId`, `distanceCm` (raw ultrasonic distance), `fillPercent` (derived: `((depth - distance) / depth) * 100`, clamped 0–100%), `dataSource` (`REAL`, `SIMULATED`), `recordedAt`.
   - Indexed on `[deviceId]` and `[recordedAt]`.
3. **`CollectionEvent`**:
   - Records each time the basket is emptied.
   - Fields: `id`, `deviceId`, `fillPercentAtCollection`, `notes`, `eventType` (`REAL`, `DEMO`), `recordedAt`.
   - Indexed on `[deviceId]` and `[recordedAt]`.
4. **`DeviceSettings`**:
   - Application-level calibration and thresholds per device.
   - Fields: `id`, `deviceId` (unique), `basketDepthCm` (default 20cm), `nearFullThresholdPct` (default 80%), `fullThresholdPct` (default 95%), `pollingIntervalSec` (default 5s), `updatedAt`.

---

## Setup & Getting Started

### 1. Install Dependencies

```bash
cd backend
npm install
```

### 2. Configure Environment Variables

Create `.env` by copying `.env.example`:

```bash
cp .env.example .env
```

Edit `.env` to configure your settings:

```env
PORT=3001
NODE_ENV=development
DATABASE_URL=postgresql://riverguard:secret@localhost:5432/riverguard_db?schema=public
FRONTEND_URL=http://localhost:5173
DEMO_MODE=true
```

> **Note**: Never commit your `.env` file to version control. Credentials are read strictly from environment variables.

### 3. Setting Up PostgreSQL

To run with a live database:

#### Option A: Docker (Quickest)
```bash
docker run --name riverguard-postgres \
  -e POSTGRES_USER=riverguard \
  -e POSTGRES_PASSWORD=secret \
  -e POSTGRES_DB=riverguard_db \
  -p 5432:5432 -d postgres:16
```

#### Option B: Local PostgreSQL Installation
Ensure your PostgreSQL server is running and create the database:
```sql
CREATE DATABASE riverguard_db;
CREATE USER riverguard WITH ENCRYPTED PASSWORD 'secret';
GRANT ALL PRIVILEGES ON DATABASE riverguard_db TO riverguard;
```

### 4. Run Migrations & Seed

Once PostgreSQL is accessible:

```bash
# Apply migrations without deleting existing data
npm run db:migrate:deploy

# Seed the default device and settings
npm run db:seed
```

> **Database Safety**: RiverGuard uses `prisma migrate deploy` which applies migrations incrementally and will never delete or reset an existing database automatically.

### 5. Start the Server

```bash
# Development (with auto-reload)
npm run dev

# Production build & start
npm run build
npm start
```

---

## Controlled Demo-Data Mode

When PostgreSQL is not configured, or when `DEMO_MODE=true` is enabled for offline development:
- The backend operates gracefully in **Controlled Demo Mode**.
- Simulated readings are explicitly marked with `dataSource: "SIMULATED"` and `isSimulated: true`.
- **Integrity Guarantee**: Simulated readings are never stored or presented as real physical measurements.
- The `GET /api/v1/health` endpoint explicitly reports `database: "disconnected"` whenever PostgreSQL is unreachable, ensuring transparency.

---

## Transactional Collection Confirmation

When confirming a collection via `POST /api/v1/collections`:
- In database mode, execution is handled in an atomic Prisma transaction (`prisma.$transaction`):
  1. Validates device existence.
  2. Creates the `CollectionEvent` record with timestamp, fill percentage, and notes.
  3. Inserts a basket-reset reading (`fillPercent: 0`, `distanceCm: basketDepthCm`) to reset the monitoring baseline.
- **Physical Removal Disclaimer**: The system records the operational event log and resets monitoring; it explicitly clarifies that it documents the event log and does not physically remove waste.

---

## API Reference (`/api/v1`)

All successful responses follow the standard JSON envelope:
```json
{
  "success": true,
  "data": { ... },
  "meta": { "timestamp": "...", "dataSource": "..." }
}
```

Paginated responses include:
```json
{
  "success": true,
  "data": [ ... ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 12,
    "totalPages": 1,
    "hasNext": false,
    "hasPrev": false
  }
}
```

### Endpoints

| Method | Endpoint | Description | Query / Body Params |
|---|---|---|---|
| `GET` | `/api/v1/health` | Service and database health check | None |
| `GET` | `/api/v1/dashboard` | Aggregated dashboard summary, metrics, and latest readings | `deviceId` (optional) |
| `GET` | `/api/v1/sensors/latest` | Most recent sensor reading | `deviceId` (optional) |
| `GET` | `/api/v1/sensors/history` | Paginated sensor readings history | `deviceId`, `from`, `to`, `page`, `limit` (max 200), `dataSource` (`REAL`, `SIMULATED`, `ALL`) |
| `GET` | `/api/v1/collections` | Paginated collection event log | `deviceId`, `from`, `to`, `page`, `limit` (max 100) |
| `POST` | `/api/v1/collections` | Record and confirm a collection event | Body: `{ fillPercentAtCollection: number (0-100), notes?: string, eventType?: "REAL" \| "DEMO" }` |
| `GET` | `/api/v1/settings` | Device calibration and thresholds | `deviceId` (optional) |
| `PATCH` | `/api/v1/settings` | Update device calibration and thresholds | Body: `{ basketDepthCm?: number, nearFullThresholdPct?: number, fullThresholdPct?: number, pollingIntervalSec?: number }` |

---

## Testing

RiverGuard includes a test suite covering routes, business logic, pagination, and Zod input validation:

```bash
npm test
```
