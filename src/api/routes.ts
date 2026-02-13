/**
 * REST API routes.
 */

import { Router } from 'express';
import { handleAvailability } from './availabilityHandler';

const router = Router();

router.post('/availability', handleAvailability);

export default router;
