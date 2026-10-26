import { z } from 'zod';

export const createCollectionBodySchema = z.object({
  deviceId: z.string().optional(),
  fillPercentAtCollection: z
    .number({ required_error: 'fillPercentAtCollection is required' })
    .min(0, 'fillPercentAtCollection cannot be negative')
    .max(100, 'fillPercentAtCollection cannot exceed 100%'),
  notes: z.string().max(500, 'Notes cannot exceed 500 characters').optional(),
  eventType: z.enum(['REAL', 'DEMO']).default('DEMO'),
});

export const queryCollectionsSchema = z.object({
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
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export type CreateCollectionInput = z.infer<typeof createCollectionBodySchema>;
export type QueryCollectionsQuery = z.infer<typeof queryCollectionsSchema>;
