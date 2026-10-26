import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { app } from '../src/app';

describe('Collections API', () => {
  describe('GET /api/v1/collections', () => {
    it('returns paginated list of collection events', async () => {
      const res = await request(app)
        .get('/api/v1/collections')
        .query({ page: 1, limit: 5 });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('success', true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body).toHaveProperty('pagination');
      expect(res.body.pagination).toHaveProperty('page', 1);
    });
  });

  describe('POST /api/v1/collections', () => {
    it('successfully records a collection event and includes clear notice', async () => {
      const payload = {
        fillPercentAtCollection: 84.5,
        notes: 'Operator basket emptying recorded',
        eventType: 'DEMO',
      };

      const res = await request(app)
        .post('/api/v1/collections')
        .send(payload);

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty('success', true);
      expect(res.body.data).toHaveProperty('id');
      expect(res.body.data.fillPercentAtCollection).toBe(84.5);
      expect(res.body.data.notes).toContain('Operator basket emptying recorded');
      expect(res.body.data).toHaveProperty('notice');
    });

    it('validates fillPercentAtCollection must not exceed 100%', async () => {
      const res = await request(app)
        .post('/api/v1/collections')
        .send({ fillPercentAtCollection: 150 });

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty('success', false);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('validates fillPercentAtCollection must not be negative', async () => {
      const res = await request(app)
        .post('/api/v1/collections')
        .send({ fillPercentAtCollection: -10 });

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty('success', false);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });
  });
});
