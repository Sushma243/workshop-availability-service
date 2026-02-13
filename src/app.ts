/**
 * Express app setup (routes, middleware). Used by index.ts to run the server
 * and by integration tests to call the API without starting a real server.
 */

import express from 'express';
import path from 'path';
import routes from './api/routes';

const app = express();
app.use(express.json());
app.use('/api', routes);

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'workshop-availability-service' });
});

// Serve UI (Viamanta-style) from public/ — only when not in test
const publicDir = path.join(__dirname, '../public');
app.use(express.static(publicDir));
app.get('/', (_req, res) => {
  res.sendFile(path.join(publicDir, 'index.html'));
});

// Invalid JSON body → 400 (express.json() passes SyntaxError to next)
app.use((err: unknown, _req: express.Request, res: express.Response, next: express.NextFunction) => {
  if (err instanceof SyntaxError && 'body' in err) {
    res.status(400).json({
      success: false,
      error: 'Invalid JSON',
      message: (err as Error).message,
    });
    return;
  }
  next(err);
});

export { app };
