/**
 * AWS Lambda handler for serverless deployment.
 * Integrates with API Gateway HTTP API or REST API.
 */

import { getWorkshopConfig } from '../config/workshopConfig';
import { computeAvailability } from '../availability/availabilityService';
import { validateAvailabilityRequest } from '../api/validation';

export type LambdaEvent = {
  body?: string;
  httpMethod?: string;
  path?: string;
  requestContext?: {
    http?: { method?: string; path?: string };
  };
};

export type LambdaContext = {
  awsRequestId: string;
};

export type LambdaResponse = {
  statusCode: number;
  headers: Record<string, string>;
  body: string;
};

export function handler(event: LambdaEvent, _context: LambdaContext): Promise<LambdaResponse> {
  const method = event.httpMethod ?? event.requestContext?.http?.method;
  const path = event.path ?? event.requestContext?.http?.path ?? '';

  if (method !== 'POST' || !path.endsWith('/availability')) {
    return Promise.resolve({
      statusCode: 404,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ success: false, error: 'Not found' }),
    });
  }

  let body: unknown;
  try {
    body = event.body ? JSON.parse(event.body) : {};
  } catch {
    return Promise.resolve({
      statusCode: 400,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        success: false,
        error: 'Invalid JSON body',
      }),
    });
  }

  const validation = validateAvailabilityRequest(body);
  if (!validation.valid || !validation.data) {
    return Promise.resolve({
      statusCode: 400,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        success: false,
        error: 'Validation failed',
        details: validation.errors,
      }),
    });
  }

  try {
    const config = getWorkshopConfig();
    const periodStart = validation.data.startDate
      ? new Date(validation.data.startDate + 'T12:00:00Z')
      : new Date();
    const response = computeAvailability(config, validation.data, periodStart);
    return Promise.resolve({
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(response),
    });
  } catch (err) {
    console.error('Availability error:', err);
    return Promise.resolve({
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        success: false,
        error: 'Internal server error',
        message: err instanceof Error ? err.message : 'Unknown error',
      }),
    });
  }
}
