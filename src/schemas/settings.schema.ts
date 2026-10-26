import { z } from 'zod';

export const getSettingsQuerySchema = z.object({
  deviceId: z.string().optional(),
});

export const updateSettingsBodySchema = z
  .object({
    deviceId: z.string().optional(),
    basketDepthCm: z
      .number({ invalid_type_error: 'basketDepthCm must be a number' })
      .positive('basketDepthCm must be greater than 0')
      .max(500, 'basketDepthCm cannot exceed 500cm')
      .optional(),
    nearFullThresholdPct: z
      .number({ invalid_type_error: 'nearFullThresholdPct must be a number' })
      .min(0, 'nearFullThresholdPct cannot be negative')
      .max(100, 'nearFullThresholdPct cannot exceed 100%')
      .optional(),
    fullThresholdPct: z
      .number({ invalid_type_error: 'fullThresholdPct must be a number' })
      .min(0, 'fullThresholdPct cannot be negative')
      .max(100, 'fullThresholdPct cannot exceed 100%')
      .optional(),
    pollingIntervalSec: z
      .number({ invalid_type_error: 'pollingIntervalSec must be a number' })
      .int('pollingIntervalSec must be an integer')
      .min(1, 'pollingIntervalSec must be at least 1 second')
      .max(3600, 'pollingIntervalSec cannot exceed 3600 seconds')
      .optional(),
  })
  .refine(
    (data) => {
      if (
        data.nearFullThresholdPct !== undefined &&
        data.fullThresholdPct !== undefined
      ) {
        return data.fullThresholdPct >= data.nearFullThresholdPct;
      }
      return true;
    },
    {
      message: 'fullThresholdPct must be greater than or equal to nearFullThresholdPct',
      path: ['fullThresholdPct'],
    }
  );

export type GetSettingsQuery = z.infer<typeof getSettingsQuerySchema>;
export type UpdateSettingsInput = z.infer<typeof updateSettingsBodySchema>;
