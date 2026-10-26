import { z } from 'zod';

export const latestSensorQuerySchema = z.object({
  deviceId: z.string().optional(),
});

export const historySensorQuerySchema = z.object({
  deviceId: z.string().optional(),
  from: z
    .string()
    .datetime({ offset: true })
    .or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Must be YYYY-MM-DD or ISO 8601 string'))
    .optional(),
  to: z
    .string()
    .datetime({ offset: true })
    .or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Must be YYYY-MM-DD or ISO 8601 string'))
    .optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(200).default(50),
  dataSource: z.enum(['REAL', 'SIMULATED', 'ALL']).default('ALL'),
});

export type LatestSensorQuery = z.infer<typeof latestSensorQuerySchema>;
export type HistorySensorQuery = z.infer<typeof historySensorQuerySchema>;
