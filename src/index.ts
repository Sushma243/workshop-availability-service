/**
 * Workshop Availability Service - Entry point.
 * Runs as Express server locally; can be adapted for AWS Lambda + API Gateway.
 */

import { app } from './app';

const PORT = process.env.PORT ?? 3000;

app.listen(PORT, () => {
  console.log(`Workshop Availability Service listening on http://localhost:${PORT}`);
  console.log('POST /api/availability - query available slots');
});
