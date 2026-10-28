import { getDb } from '../db/connection.js';
import { newId, nowIso } from '../utils/ids.js';

export function toPublicUser(user) {
  if (!user) return null;
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    createdAt: user.created_at,
  };
}

export function createUser({ name, email, passwordHash, role = 'user', id = newId('user') }) {
  const now = nowIso();
  getDb().prepare(`
    INSERT INTO users (id, name, email, password_hash, role, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(id, name, email.toLowerCase(), passwordHash, role, now, now);
  return findUserById(id);
}

export function findUserById(id) {
  return getDb().prepare('SELECT * FROM users WHERE id = ?').get(id);
}

export function findUserByEmail(email) {
  return getDb().prepare('SELECT * FROM users WHERE email = ? COLLATE NOCASE').get(String(email || '').trim());
}

export function updatePassword(userId, passwordHash) {
  getDb().prepare('UPDATE users SET password_hash = ?, updated_at = ? WHERE id = ?')
    .run(passwordHash, nowIso(), userId);
}

export function setUserRole(userId, role) {
  getDb().prepare('UPDATE users SET role = ?, updated_at = ? WHERE id = ?')
    .run(role, nowIso(), userId);
  return findUserById(userId);
}
