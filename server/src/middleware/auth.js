import { config } from '../config/index.js';
import { httpError } from '../utils/httpError.js';
import { findUserBySessionToken } from '../repositories/sessionRepository.js';

function readCookie(req, name) {
  const header = req.headers.cookie;
  if (!header) return null;
  for (const part of header.split(';')) {
    const index = part.indexOf('=');
    if (index === -1) continue;
    if (part.slice(0, index).trim() === name) {
      try {
        return decodeURIComponent(part.slice(index + 1).trim());
      } catch {
        return null;
      }
    }
  }
  return null;
}

export const getSessionToken = (req) => readCookie(req, config.sessionCookieName);

export function setSessionCookie(res, token, expiresAt) {
  res.cookie(config.sessionCookieName, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: config.secureCookies,
    path: '/',
    expires: expiresAt,
  });
}

export function clearSessionCookie(res) {
  res.clearCookie(config.sessionCookieName, {
    httpOnly: true,
    sameSite: 'lax',
    secure: config.secureCookies,
    path: '/',
  });
}

export function attachUser(req, _res, next) {
  req.sessionToken = getSessionToken(req);
  req.user = findUserBySessionToken(req.sessionToken);
  next();
}

export function requireAuth(req, _res, next) {
  if (!req.user) return next(httpError(401, 'AUTH_REQUIRED', 'Please sign in to continue.'));
  next();
}

export function requirePasswordChangeComplete(req, _res, next) {
  if (req.user?.must_change_password) {
    return next(httpError(403, 'PASSWORD_CHANGE_REQUIRED', 'Change your temporary password before continuing.'));
  }
  next();
}

export function requireAdmin(req, _res, next) {
  if (req.user?.role !== 'admin') {
    return next(httpError(403, 'FORBIDDEN', 'You do not have permission to do that.'));
  }
  next();
}

export function noStore(_req, res, next) {
  res.set('Cache-Control', 'no-store');
  next();
}

export function originGuard(req, _res, next) {
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) return next();
  const origin = req.get('origin');
  if (origin && !config.frontendOrigins.includes(origin)) {
    return next(httpError(403, 'ORIGIN_NOT_ALLOWED', 'This request came from an origin that is not allowed.'));
  }
  if (!origin && req.get('sec-fetch-site') === 'cross-site') {
    return next(httpError(403, 'ORIGIN_NOT_ALLOWED', 'This request came from an origin that is not allowed.'));
  }
  next();
}
