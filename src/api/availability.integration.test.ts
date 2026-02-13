/**
 * Integration tests: call the real HTTP API (POST /api/availability, GET /health)
 * using the actual workshop config from workshops.config.json.
 */

import request from 'supertest';
import { app } from '../app';

describe('API integration', () => {
  describe('GET /health', () => {
    it('returns 200 and status ok', async () => {
      const res = await request(app).get('/health');
      expect(res.status).toBe(200);
      expect(res.body).toEqual({
        status: 'ok',
        service: 'workshop-availability-service',
      });
    });
  });

  describe('POST /api/availability', () => {
    it('returns 200 with request summary and results for MOT + Brakes', async () => {
      const res = await request(app)
        .post('/api/availability')
        .set('Content-Type', 'application/json')
        .send({ services: ['MOT'], repairs: ['Brakes'] });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      expect(res.body.request).toMatchObject({
        services: ['MOT'],
        repairs: ['Brakes'],
        totalRequestedHours: 7,
      });
      expect(res.body.request.startDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(res.body.request.endDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);

      expect(Array.isArray(res.body.results)).toBe(true);
      expect(res.body.results.length).toBeGreaterThan(0);

      const amsterdam = res.body.results.find((r: { workshopId: string }) => r.workshopId === 'workshop-1');
      expect(amsterdam).toBeDefined();
      expect(amsterdam.workshopName).toBe('Amsterdam Central');
      expect(amsterdam.canFulfillRequest).toBe(true);
      expect(Array.isArray(amsterdam.availableSlots)).toBe(true);

      if (amsterdam.availableSlots.length > 0) {
        const slot = amsterdam.availableSlots[0];
        expect(slot).toHaveProperty('checkIn');
        expect(slot).toHaveProperty('checkOut');
        expect(slot).toHaveProperty('totalWorkHours', 7);
        expect(slot).toHaveProperty('totalDays');
        expect(Array.isArray(slot.schedule)).toBe(true);
        expect(slot.schedule.length).toBe(2);
        expect(slot.schedule[0].jobName).toBe('MOT');
        expect(slot.schedule[1].jobName).toBe('Brakes');
        expect(slot.schedule[0].endHour).toBe(slot.schedule[1].startHour);
      }
    });

    it('returns 400 when body is invalid', async () => {
      const res = await request(app)
        .post('/api/availability')
        .set('Content-Type', 'application/json')
        .send({ services: [], repairs: [] });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toBe('Validation failed');
      expect(Array.isArray(res.body.details)).toBe(true);
    });

    it('returns 400 when services is missing', async () => {
      const res = await request(app)
        .post('/api/availability')
        .set('Content-Type', 'application/json')
        .send({ repairs: ['Brakes'] });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toBe('Validation failed');
    });

    it('returns 400 when repairs is missing', async () => {
      const res = await request(app)
        .post('/api/availability')
        .set('Content-Type', 'application/json')
        .send({ services: ['MOT'] });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.details).toBeDefined();
    });

    it('returns 400 when body is empty object (no services or repairs)', async () => {
      const res = await request(app)
        .post('/api/availability')
        .set('Content-Type', 'application/json')
        .send({});

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('returns 400 when body is invalid JSON', async () => {
      const res = await request(app)
        .post('/api/availability')
        .set('Content-Type', 'application/json')
        .send('not json {');

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toBe('Invalid JSON');
    });

    it('returns 200 with only services requested', async () => {
      const res = await request(app)
        .post('/api/availability')
        .set('Content-Type', 'application/json')
        .send({ services: ['MOT', 'ADR'], repairs: [] });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.request.services).toEqual(['MOT', 'ADR']);
      expect(res.body.request.repairs).toEqual([]);
      expect(res.body.request.totalRequestedHours).toBe(10);
    });

    it('returns 200 with only repairs requested (dependency resolved server-side)', async () => {
      const res = await request(app)
        .post('/api/availability')
        .set('Content-Type', 'application/json')
        .send({ services: [], repairs: ['Brakes'] });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.request.totalRequestedHours).toBe(7);
      const workshop1 = res.body.results.find((r: { workshopId: string }) => r.workshopId === 'workshop-1');
      expect(workshop1.canFulfillRequest).toBe(true);
      expect(workshop1.availableSlots[0].schedule[0].jobName).toBe('MOT');
      expect(workshop1.availableSlots[0].schedule[1].jobName).toBe('Brakes');
    });

    it('returns workshop with canFulfillRequest false and missingServicesOrRepairs when it cannot do requested job', async () => {
      const res = await request(app)
        .post('/api/availability')
        .set('Content-Type', 'application/json')
        .send({ services: [], repairs: ['Body'] });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      const amsterdam = res.body.results.find((r: { workshopId: string }) => r.workshopId === 'workshop-1');
      const rotterdam = res.body.results.find((r: { workshopId: string }) => r.workshopId === 'workshop-2');
      expect(amsterdam.canFulfillRequest).toBe(false);
      expect(amsterdam.missingServicesOrRepairs).toContain('Body');
      expect(amsterdam.availableSlots).toEqual([]);
      expect(rotterdam.canFulfillRequest).toBe(true);
      expect(rotterdam.availableSlots.length).toBeGreaterThan(0);
    });

    it('returns 404 for GET /api/availability (method not allowed)', async () => {
      const res = await request(app).get('/api/availability');
      expect(res.status).toBe(404);
    });
  });
});
