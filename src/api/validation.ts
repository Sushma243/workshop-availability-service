/**
 * Request validation for availability API.
 */

import type { AvailabilityRequest } from '../domain/types';

export interface ValidationError {
  field: string;
  message: string;
}

export function validateAvailabilityRequest(body: unknown): {
  valid: boolean;
  data?: AvailabilityRequest;
  errors?: ValidationError[];
} {
  if (body === null || typeof body !== 'object') {
    return { valid: false, errors: [{ field: 'body', message: 'Request body must be a JSON object' }] };
  }
  const o = body as Record<string, unknown>;
  const errors: ValidationError[] = [];

  if (!Array.isArray(o.services)) {
    errors.push({ field: 'services', message: 'services must be an array of strings' });
  }
  if (!Array.isArray(o.repairs)) {
    errors.push({ field: 'repairs', message: 'repairs must be an array of strings' });
  }

  const services = Array.isArray(o.services)
    ? o.services.filter((x): x is string => typeof x === 'string')
    : [];
  const repairs = Array.isArray(o.repairs)
    ? o.repairs.filter((x): x is string => typeof x === 'string')
    : [];

  if (services.length === 0 && repairs.length === 0) {
    errors.push({
      field: 'request',
      message: 'At least one service or repair must be requested',
    });
  }

  if (errors.length > 0) {
    return { valid: false, errors };
  }
  return { valid: true, data: { services, repairs } };
}
