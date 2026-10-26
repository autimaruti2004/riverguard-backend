import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { app } from '../src/app';

describe('Settings API', () => {
  describe('GET /api/v1/settings', () => {
    it('returns current device calibration settings', async () => {
      const res = await request(app).get('/api/v1/settings');

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('success', true);
      expect(res.body.data).toHaveProperty('basketDepthCm');
      expect(res.body.data).toHaveProperty('nearFullThresholdPct');
      expect(res.body.data).toHaveProperty('fullThresholdPct');
      expect(res.body.data).toHaveProperty('pollingIntervalSec');
    });
  });

  describe('PATCH /api/v1/settings', () => {
    it('updates device settings with valid thresholds', async () => {
      const res = await request(app)
        .patch('/api/v1/settings')
        .send({
          nearFullThresholdPct: 75,
          fullThresholdPct: 90,
          basketDepthCm: 25,
        });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('success', true);
      expect(res.body.data.nearFullThresholdPct).toBe(75);
      expect(res.body.data.fullThresholdPct).toBe(90);
      expect(res.body.data.basketDepthCm).toBe(25);
    });

    it('rejects setting fullThresholdPct lower than nearFullThresholdPct', async () => {
      const res = await request(app)
        .patch('/api/v1/settings')
        .send({
          nearFullThresholdPct: 85,
          fullThresholdPct: 60,
        });

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty('success', false);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('rejects invalid basketDepthCm (negative or zero)', async () => {
      const res = await request(app)
        .patch('/api/v1/settings')
        .send({
          basketDepthCm: -5,
        });

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty('success', false);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });
  });
});
