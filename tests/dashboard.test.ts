import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { app } from '../src/app';

describe('Dashboard API', () => {
  describe('GET /api/v1/dashboard', () => {
    it('returns combined dashboard summary, device info, settings, and metrics', async () => {
      const res = await request(app).get('/api/v1/dashboard');

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('success', true);
      expect(res.body.data).toHaveProperty('device');
      expect(res.body.data).toHaveProperty('settings');
      expect(res.body.data).toHaveProperty('summary');
      expect(res.body.data.summary).toHaveProperty('currentFillPercent');
      expect(res.body.data.summary).toHaveProperty('status');
      expect(res.body.data.summary).toHaveProperty('totalCollections');
      expect(res.body.data).toHaveProperty('recentReadings');
      expect(res.body.data).toHaveProperty('recentCollections');
    });
  });
});
