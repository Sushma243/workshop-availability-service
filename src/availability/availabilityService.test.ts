import { computeAvailability } from './availabilityService';
import type { WorkshopConfig, AvailabilityRequest } from '../domain/types';

const minimalConfig: WorkshopConfig = {
  services: [{ id: 'MOT', name: 'MOT', durationHours: 6 }],
  repairs: [
    { id: 'Brakes', name: 'Brakes', durationHours: 1, dependency: 'MOT' },
  ],
  workshops: [
    {
      id: 'w1',
      name: 'Test Workshop',
      workingHours: { startHour: 9, endHour: 17 },
      workingDays: [1, 2, 3, 4, 5],
      bays: [
        {
          id: 'Bay-1',
          capabilities: [
            { type: 'service', id: 'MOT', days: [1, 2, 3, 4, 5] },
            { type: 'repair', id: 'Brakes', days: [1, 2, 3, 4, 5] },
          ],
        },
      ],
    },
  ],
};

describe('computeAvailability', () => {
  it('returns success and request summary', () => {
    const request: AvailabilityRequest = { services: ['MOT'], repairs: ['Brakes'] };
    const fixedDate = new Date('2026-02-09T12:00:00Z');
    const result = computeAvailability(minimalConfig, request, fixedDate);
    expect(result.success).toBe(true);
    expect(result.request.services).toEqual(['MOT']);
    expect(result.request.repairs).toEqual(['Brakes']);
    expect(result.request.totalRequestedHours).toBe(7);
    expect(result.request.startDate).toBe('2026-02-09');
    expect(result.request.endDate).toBe('2026-04-09'); // 60-day window: start + 59
  });

  it('orders jobs with dependency first (MOT before Brakes)', () => {
    const request: AvailabilityRequest = { services: ['MOT'], repairs: ['Brakes'] };
    const fixedDate = new Date('2026-02-09T12:00:00Z');
    const result = computeAvailability(minimalConfig, request, fixedDate);
    expect(result.results).toHaveLength(1);
    const slots = result.results[0].availableSlots;
    expect(slots.length).toBeGreaterThan(0);
    const schedule = slots[0].schedule;
    expect(schedule[0].jobName).toBe('MOT');
    expect(schedule[1].jobName).toBe('Brakes');
    expect(schedule[0].endHour).toBe(schedule[1].startHour);
  });

  it('marks workshop as cannot fulfill when service missing', () => {
    const configNoMOT: WorkshopConfig = {
      ...minimalConfig,
      workshops: [
        {
          ...minimalConfig.workshops[0],
          bays: [
            {
              id: 'Bay-1',
              capabilities: [{ type: 'repair', id: 'Brakes', days: [1, 2, 3, 4, 5] }],
            },
          ],
        },
      ],
    };
    const result = computeAvailability(configNoMOT, {
      services: ['MOT'],
      repairs: ['Brakes'],
    });
    expect(result.results[0].canFulfillRequest).toBe(false);
    expect(result.results[0].missingServicesOrRepairs).toContain('MOT');
  });

  it('returns empty availableSlots when workshop cannot fulfill', () => {
    const configNoMOT: WorkshopConfig = {
      ...minimalConfig,
      workshops: [
        {
          ...minimalConfig.workshops[0],
          bays: [{ id: 'Bay-1', capabilities: [] }],
        },
      ],
    };
    const result = computeAvailability(configNoMOT, {
      services: ['MOT'],
      repairs: [],
    });
    expect(result.results).toHaveLength(1);
    expect(result.results[0].canFulfillRequest).toBe(false);
    expect(result.results[0].availableSlots).toEqual([]);
  });

  it('uses 60-day query window (startDate to endDate inclusive)', () => {
    const request: AvailabilityRequest = { services: ['MOT'], repairs: [] };
    const start = new Date('2026-01-01T12:00:00Z');
    const result = computeAvailability(minimalConfig, request, start);
    expect(result.request.startDate).toBe('2026-01-01');
    expect(result.request.endDate).toBe('2026-03-01'); // 60-day window: Jan 1 UTC + 59 days (2026 leap year)
  });

  it('schedules jobs only within working hours', () => {
    const request: AvailabilityRequest = { services: ['MOT'], repairs: ['Brakes'] };
    const fixedDate = new Date('2026-02-09T12:00:00Z'); // Monday
    const result = computeAvailability(minimalConfig, request, fixedDate);
    const slots = result.results[0].availableSlots;
    expect(slots.length).toBeGreaterThan(0);
    for (const slot of slots) {
      for (const job of slot.schedule) {
        expect(job.startHour).toBeGreaterThanOrEqual(minimalConfig.workshops[0].workingHours.startHour);
        expect(job.endHour).toBeLessThanOrEqual(minimalConfig.workshops[0].workingHours.endHour);
      }
    }
  });

  it('returns canFulfillRequest false and missing when workshop has no bays', () => {
    const configNoBays: WorkshopConfig = {
      ...minimalConfig,
      workshops: [{ ...minimalConfig.workshops[0], bays: [] }],
    };
    const result = computeAvailability(configNoBays, {
      services: ['MOT'],
      repairs: [],
    });
    expect(result.results[0].canFulfillRequest).toBe(false);
    expect(result.results[0].missingServicesOrRepairs).toContain('MOT');
    expect(result.results[0].availableSlots).toEqual([]);
  });

  it('includes unknown requested service in missing and cannot fulfill', () => {
    const result = computeAvailability(minimalConfig, {
      services: ['MOT', 'UNKNOWN_SERVICE'],
      repairs: [],
    });
    expect(result.results[0].canFulfillRequest).toBe(false);
    expect(result.results[0].missingServicesOrRepairs).toContain('UNKNOWN_SERVICE');
  });

  it('includes unknown requested repair in missing and cannot fulfill', () => {
    const result = computeAvailability(minimalConfig, {
      services: [],
      repairs: ['UNKNOWN_REPAIR'],
    });
    expect(result.results[0].canFulfillRequest).toBe(false);
    expect(result.results[0].missingServicesOrRepairs).toContain('UNKNOWN_REPAIR');
  });

  it('succeeds with only repairs (dependency MOT added to job order)', () => {
    const request: AvailabilityRequest = { services: [], repairs: ['Brakes'] };
    const fixedDate = new Date('2026-02-09T12:00:00Z');
    const result = computeAvailability(minimalConfig, request, fixedDate);
    expect(result.success).toBe(true);
    expect(result.request.totalRequestedHours).toBe(7); // MOT 6 + Brakes 1
    expect(result.results[0].availableSlots.length).toBeGreaterThan(0);
    const schedule = result.results[0].availableSlots[0].schedule;
    expect(schedule[0].jobName).toBe('MOT');
    expect(schedule[1].jobName).toBe('Brakes');
  });

  it('returns one result per workshop (multiple workshops)', () => {
    const twoWorkshops: WorkshopConfig = {
      ...minimalConfig,
      workshops: [
        minimalConfig.workshops[0],
        { ...minimalConfig.workshops[0], id: 'w2', name: 'Second Workshop' },
      ],
    };
    const result = computeAvailability(twoWorkshops, {
      services: ['MOT'],
      repairs: [],
    });
    expect(result.results).toHaveLength(2);
    expect(result.results[0].workshopId).toBe('w1');
    expect(result.results[1].workshopId).toBe('w2');
  });

  it('each slot schedule has required fields (bayId, date, startHour, endHour, duration)', () => {
    const request: AvailabilityRequest = { services: ['MOT'], repairs: ['Brakes'] };
    const fixedDate = new Date('2026-02-09T12:00:00Z');
    const result = computeAvailability(minimalConfig, request, fixedDate);
    const slot = result.results[0].availableSlots[0];
    for (const job of slot.schedule) {
      expect(job).toHaveProperty('bayId');
      expect(job).toHaveProperty('date');
      expect(job).toHaveProperty('startHour');
      expect(job).toHaveProperty('endHour');
      expect(job).toHaveProperty('duration');
      expect(job.endHour - job.startHour).toBe(job.duration);
    }
  });

  it('handles request with only services (no repairs)', () => {
    const request: AvailabilityRequest = { services: ['MOT'], repairs: [] };
    const fixedDate = new Date('2026-02-09T12:00:00Z');
    const result = computeAvailability(minimalConfig, request, fixedDate);
    expect(result.success).toBe(true);
    expect(result.request.totalRequestedHours).toBe(6);
    expect(result.results[0].availableSlots[0].schedule).toHaveLength(1);
    expect(result.results[0].availableSlots[0].schedule[0].jobName).toBe('MOT');
  });
});
