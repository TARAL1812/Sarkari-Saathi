import crypto from 'node:crypto';
import { getDb } from '../db/connection.js';
import { config } from '../config/index.js';
import { nowIso } from '../utils/ids.js';

function hashToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

export function createSession(userId) {
  const token = crypto.randomBytes(32).toString('base64url');
  const createdAt = nowIso();
  const expiresAt = new Date(Date.now() + config.sessionTtlDays * 24 * 60 * 60 * 1000);
  getDb().prepare(`
    INSERT INTO sessions (id, user_id, created_at, expires_at)
    VALUES (?, ?, ?, ?)
  `).run(hashToken(token), userId, createdAt, expiresAt.toISOString());
  return { token, expiresAt };
}

export function findUserBySessionToken(token) {
  if (!token) return null;
  const row = getDb().prepare(`
    SELECT users.* FROM sessions
    JOIN users ON users.id = sessions.user_id
    WHERE sessions.id = ? AND sessions.expires_at > ?
  `).get(hashToken(token), nowIso());
  return row || null;
}

export function deleteSession(token) {
  if (!token) return;
  getDb().prepare('DELETE FROM sessions WHERE id = ?').run(hashToken(token));
}

export function deleteUserSessions(userId) {
  getDb().prepare('DELETE FROM sessions WHERE user_id = ?').run(userId);
}

export function deleteExpiredSessions() {
  getDb().prepare('DELETE FROM sessions WHERE expires_at <= ?').run(nowIso());
}
