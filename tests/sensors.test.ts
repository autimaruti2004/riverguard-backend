import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { app } from '../src/app';

describe('Sensors API', () => {
  describe('GET /api/v1/sensors/latest', () => {
    it('returns the latest sensor reading with distance and fill percentage', async () => {
      const res = await request(app).get('/api/v1/sensors/latest');

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('success', true);
      expect(res.body.data).toHaveProperty('distanceCm');
      expect(res.body.data).toHaveProperty('fillPercent');
      expect(res.body.data).toHaveProperty('dataSource');
      expect(typeof res.body.data.fillPercent).toBe('number');
      expect(res.body.data.fillPercent).toBeGreaterThanOrEqual(0);
      expect(res.body.data.fillPercent).toBeLessThanOrEqual(100);
    });
  });

  describe('GET /api/v1/sensors/history', () => {
    it('returns paginated reading history', async () => {
      const res = await request(app)
        .get('/api/v1/sensors/history')
        .query({ page: 1, limit: 10 });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('success', true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBeLessThanOrEqual(10);
      expect(res.body).toHaveProperty('pagination');
      expect(res.body.pagination).toHaveProperty('page', 1);
      expect(res.body.pagination).toHaveProperty('limit', 10);
      expect(res.body.pagination).toHaveProperty('total');
      expect(res.body.pagination).toHaveProperty('totalPages');
    });

    it('rejects invalid limit exceeding max of 200', async () => {
      const res = await request(app)
        .get('/api/v1/sensors/history')
        .query({ limit: 500 });

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty('success', false);
      expect(res.body.error).toHaveProperty('code', 'VALIDATION_ERROR');
    });

    it('rejects invalid date format', async () => {
      const res = await request(app)
        .get('/api/v1/sensors/history')
        .query({ from: 'not-a-date' });

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty('success', false);
    });
  });
});
