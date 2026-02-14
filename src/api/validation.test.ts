import { validateAvailabilityRequest } from './validation';

describe('validateAvailabilityRequest', () => {
  it('accepts valid request with services and repairs', () => {
    const result = validateAvailabilityRequest({
      services: ['MOT'],
      repairs: ['Brakes'],
    });
    expect(result.valid).toBe(true);
    expect(result.data).toEqual({ services: ['MOT'], repairs: ['Brakes'] });
  });

  it('accepts request with only services', () => {
    const result = validateAvailabilityRequest({
      services: ['MOT', 'ADR'],
      repairs: [],
    });
    expect(result.valid).toBe(true);
    expect(result.data?.services).toEqual(['MOT', 'ADR']);
  });

  it('rejects non-object body', () => {
    const result = validateAvailabilityRequest(null);
    expect(result.valid).toBe(false);
    expect(result.errors).toContainEqual(
      expect.objectContaining({ field: 'body', message: expect.any(String) })
    );
  });

  it('rejects missing services array', () => {
    const result = validateAvailabilityRequest({ repairs: ['Brakes'] });
    expect(result.valid).toBe(false);
    expect(result.errors?.some((e) => e.field === 'services')).toBe(true);
  });

  it('rejects missing repairs array', () => {
    const result = validateAvailabilityRequest({ services: ['MOT'] });
    expect(result.valid).toBe(false);
    expect(result.errors?.some((e) => e.field === 'repairs')).toBe(true);
  });

  it('rejects empty services and repairs', () => {
    const result = validateAvailabilityRequest({ services: [], repairs: [] });
    expect(result.valid).toBe(false);
    expect(result.errors?.some((e) => e.field === 'request')).toBe(true);
  });

  it('filters non-string entries and returns valid data', () => {
    const result = validateAvailabilityRequest({
      services: ['MOT', 1, null, 'ADR'],
      repairs: ['Brakes'],
    });
    expect(result.valid).toBe(true);
    expect(result.data?.services).toEqual(['MOT', 'ADR']);
    expect(result.data?.repairs).toEqual(['Brakes']);
  });

  it('rejects when body is undefined', () => {
    const result = validateAvailabilityRequest(undefined);
    expect(result.valid).toBe(false);
    expect(result.errors?.some((e) => e.field === 'body')).toBe(true);
  });

  it('rejects when body is a string (not object)', () => {
    const result = validateAvailabilityRequest('invalid');
    expect(result.valid).toBe(false);
    expect(result.errors?.some((e) => e.field === 'body')).toBe(true);
  });

  it('rejects when body is an array', () => {
    const result = validateAvailabilityRequest([]);
    expect(result.valid).toBe(false);
    expect(result.errors?.some((e) => e.field === 'body')).toBe(true);
  });

  it('rejects when services is not an array (e.g. object)', () => {
    const result = validateAvailabilityRequest({ services: {}, repairs: [] });
    expect(result.valid).toBe(false);
    expect(result.errors?.some((e) => e.field === 'services')).toBe(true);
  });

  it('rejects when repairs is not an array (e.g. number)', () => {
    const result = validateAvailabilityRequest({ services: ['MOT'], repairs: 123 });
    expect(result.valid).toBe(false);
    expect(result.errors?.some((e) => e.field === 'repairs')).toBe(true);
  });

  it('accepts request with only repairs', () => {
    const result = validateAvailabilityRequest({
      services: [],
      repairs: ['Brakes', 'Axels'],
    });
    expect(result.valid).toBe(true);
    expect(result.data?.repairs).toEqual(['Brakes', 'Axels']);
    expect(result.data?.services).toEqual([]);
  });

  it('rejects when all entries are filtered out (no valid strings)', () => {
    const result = validateAvailabilityRequest({
      services: [1, null, true],
      repairs: [],
    });
    expect(result.valid).toBe(false);
    expect(result.errors?.some((e) => e.field === 'request')).toBe(true);
  });

  it('rejects when both arrays exist but become empty after filtering', () => {
    const result = validateAvailabilityRequest({
      services: [1, 2],
      repairs: [null, undefined],
    });
    expect(result.valid).toBe(false);
    expect(result.errors?.some((e) => e.field === 'request')).toBe(true);
  });

  it('accepts optional startDate in YYYY-MM-DD format', () => {
    const result = validateAvailabilityRequest({
      services: ['MOT'],
      repairs: [],
      startDate: '2026-03-01',
    });
    expect(result.valid).toBe(true);
    expect(result.data?.startDate).toBe('2026-03-01');
  });

  it('rejects startDate when not YYYY-MM-DD', () => {
    const result = validateAvailabilityRequest({
      services: ['MOT'],
      repairs: [],
      startDate: '03/01/2026',
    });
    expect(result.valid).toBe(false);
    expect(result.errors?.some((e) => e.field === 'startDate')).toBe(true);
  });

  it('rejects startDate when invalid date', () => {
    const result = validateAvailabilityRequest({
      services: ['MOT'],
      repairs: [],
      startDate: '2026-13-01', // month 13 is invalid
    });
    expect(result.valid).toBe(false);
    expect(result.errors?.some((e) => e.field === 'startDate')).toBe(true);
  });
});
