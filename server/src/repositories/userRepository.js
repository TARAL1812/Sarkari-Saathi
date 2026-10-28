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
    mustChangePassword: Boolean(user.must_change_password),
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
  getDb().prepare('UPDATE users SET password_hash = ?, must_change_password = 0, updated_at = ? WHERE id = ?')
    .run(passwordHash, nowIso(), userId);
}

export function setTemporaryPassword(userId, passwordHash) {
  getDb().prepare(`
    UPDATE users SET password_hash = ?, must_change_password = 1, updated_at = ?
    WHERE id = ?
  `).run(passwordHash, nowIso(), userId);
}

export function recordSuccessfulLogin(userId) {
  getDb().prepare(`
    UPDATE users SET login_count = login_count + 1, last_login_at = ?, updated_at = ?
    WHERE id = ?
  `).run(nowIso(), nowIso(), userId);
  return findUserById(userId);
}

export function getAdminUserOverview() {
  const database = getDb();
  const now = nowIso();
  const totals = database.prepare(`
    SELECT
      COUNT(*) AS total_accounts,
      SUM(CASE WHEN role = 'admin' THEN 1 ELSE 0 END) AS admin_accounts,
      COALESCE(SUM(login_count), 0) AS successful_logins
    FROM users
  `).get();
  const active = database.prepare(`
    SELECT COUNT(DISTINCT user_id) AS active_users
    FROM sessions
    WHERE expires_at > ?
  `).get(now);
  const users = database.prepare(`
    SELECT
      users.id, users.name, users.email, users.role, users.created_at,
      users.login_count, users.last_login_at,
      EXISTS (
        SELECT 1 FROM sessions
        WHERE sessions.user_id = users.id AND sessions.expires_at > ?
      ) AS is_active
    FROM users
    ORDER BY users.role DESC, users.name COLLATE NOCASE
  `).all(now);

  return {
    totalAccounts: totals.total_accounts,
    adminAccounts: totals.admin_accounts || 0,
    activeUsers: active.active_users,
    successfulLogins: totals.successful_logins,
    users: users.map((user) => ({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      createdAt: user.created_at,
      loginCount: user.login_count,
      lastLoginAt: user.last_login_at,
      isActive: Boolean(user.is_active),
    })),
  };
}

export function setUserRole(userId, role) {
  getDb().prepare('UPDATE users SET role = ?, updated_at = ? WHERE id = ?')
    .run(role, nowIso(), userId);
  return findUserById(userId);
}

export function deleteUser(userId) {
  return getDb().prepare('DELETE FROM users WHERE id = ?').run(userId).changes > 0;
}

export function countAdminUsers() {
  return getDb().prepare("SELECT COUNT(*) AS count FROM users WHERE role = 'admin'").get().count;
}
