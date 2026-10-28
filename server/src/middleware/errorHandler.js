import { config } from '../config/index.js';
import { HttpError } from '../utils/httpError.js';

export function notFound(_req, _res, next) {
  next(new HttpError(404, 'NOT_FOUND', 'No endpoint matches that request.'));
}

export function errorHandler(err, _req, res, _next) {
  if (err?.type === 'entity.parse.failed' || err instanceof SyntaxError) {
    return res.status(400).json({
      error: { code: 'INVALID_JSON', message: 'Request body must be valid JSON.' },
    });
  }

  if (err instanceof HttpError) {
    return res.status(err.status).json({
      error: { code: err.code, message: err.message, details: err.details },
    });
  }

  if (String(err?.code || '').startsWith('SQLITE_CONSTRAINT')) {
    return res.status(409).json({
      error: { code: 'CONSTRAINT', message: 'That change conflicts with existing data.' },
    });
  }

  console.error(JSON.stringify({
    level: 'error',
    message: err?.message || 'Unhandled error',
    stack: config.nodeEnv === 'development' ? err?.stack : undefined,
  }));

  return res.status(500).json({
    error: { code: 'SERVER_ERROR', message: 'Something went wrong while processing the request.' },
  });
}

export function requestLogger(req, res, next) {
  const start = Date.now();
  res.on('finish', () => {
    if (config.nodeEnv === 'test') return;
    console.log(JSON.stringify({
      method: req.method,
      path: (req.originalUrl || req.url).split('?')[0],
      status: res.statusCode,
      ms: Date.now() - start,
      userId: req.user?.id || null,
    }));
  });
  next();
}
