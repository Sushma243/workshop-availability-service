/**
 * HTTP handler for POST /api/availability.
 * Used by Express and can be wrapped for AWS Lambda.
 */

import { getWorkshopConfig } from '../config/workshopConfig';
import { computeAvailability } from '../availability/availabilityService';
import { validateAvailabilityRequest } from './validation';
import type { Request, Response } from 'express';

export function handleAvailability(req: Request, res: Response): void {
  const validation = validateAvailabilityRequest(req.body);
  if (!validation.valid || !validation.data) {
    res.status(400).json({
      success: false,
      error: 'Validation failed',
      details: validation.errors,
    });
    return;
  }
  try {
    const config = getWorkshopConfig();
    const response = computeAvailability(config, validation.data);
    res.status(200).json(response);
  } catch (err) {
    console.error('Availability error:', err);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: err instanceof Error ? err.message : 'Unknown error',
    });
  }
}
