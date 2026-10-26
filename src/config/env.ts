// ─── Environment validation ───────────────────────────────────────────────────
// Loaded once at startup. Validates all required variables and exports them
// with correct TypeScript types. Never access process.env directly elsewhere.

import 'dotenv/config';
import { z } from 'zod';

const envSchema = z.object({
  PORT: z
    .union([z.string(), z.number()])
    .default('3001')
    .transform((val) => Number(val))
    .refine((n) => n > 0 && n < 65536, 'PORT must be a valid TCP port'),
  NODE_ENV: z
    .enum(['development', 'test', 'production'])
    .default('development'),
  DATABASE_URL: z
    .string()
    .default('postgresql://riverguard:secret@localhost:5432/riverguard_db?schema=public'),
  FRONTEND_URL: z
    .string()
    .default('http://localhost:5173'),
  DEMO_MODE: z
    .union([z.string(), z.boolean()])
    .default('true')
    .transform((v) => (typeof v === 'boolean' ? v : v.toLowerCase() === 'true')),
});

const _parsed = envSchema.safeParse(process.env);

if (!_parsed.success) {
  console.error('❌ Environment validation failed:');
  _parsed.error.errors.forEach((e) => {
    console.error(`   ${e.path.join('.')}: ${e.message}`);
  });
  process.exit(1);
}

export const env = _parsed.data;
export type Env = typeof env;

// Ensure process.env.DATABASE_URL is explicitly set for Prisma client
if (!process.env.DATABASE_URL) {
  process.env.DATABASE_URL = env.DATABASE_URL;
}
