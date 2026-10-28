import cors from 'cors';
import express from 'express';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import { config } from './config/index.js';
import { attachUser, originGuard } from './middleware/auth.js';
import { errorHandler, notFound, requestLogger } from './middleware/errorHandler.js';
import routes from './routes/index.js';

export function createApp({ authRateLimit = config.authRateLimit } = {}) {
  const app = express();

  if (config.trustProxy) {
    app.set('trust proxy', /^\d+$/.test(config.trustProxy) ? Number(config.trustProxy) : config.trustProxy);
  }

  app.use(helmet());
  app.use(cors({ origin: config.frontendOrigins, credentials: true }));
  app.use(express.json({ limit: '256kb' }));
  app.use(rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 300,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
  }));

  const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: authRateLimit,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    skipSuccessfulRequests: true,
    message: { error: { code: 'RATE_LIMITED', message: 'Too many attempts. Please wait a few minutes and try again.' } },
  });
  app.use('/api/auth/login', authLimiter);
  app.use('/api/auth/register', authLimiter);
  app.use('/api/auth/change-password', authLimiter);

  app.use(originGuard);
  app.use(attachUser);
  app.use(requestLogger);

  const catalog = {
    service: 'sarkari-saathi-api',
    message: 'Standalone JSON API. This backend is not connected to the frontend.',
    endpoints: [
      'GET /api/health',
      'GET /api/categories',
      'GET /api/journeys',
      'GET /api/journeys/:id',
      'GET /api/journeys/:id/steps',
      'GET /api/journeys/:id/documents',
      'GET /api/journeys/:id/branches',
      'POST /api/auth/register',
      'POST /api/auth/login',
      'POST /api/auth/logout',
      'GET /api/auth/me',
      'POST /api/auth/change-password',
      'GET|POST /api/me/journeys',
      'GET|PUT|DELETE /api/me/journeys/:id',
      'PATCH /api/me/journeys/:id/progress',
      'PATCH /api/me/journeys/:id/checklist',
      'GET|PUT /api/me/abroad',
      'GET|POST /api/me/requests',
      'GET|POST /api/admin/journeys (admin)',
      'GET|PATCH /api/admin/requests (admin)',
    ],
  };
  app.get('/', (_req, res) => res.json({ data: catalog }));
  app.use('/api', routes);
  app.use(notFound);
  app.use(errorHandler);
  return app;
}
