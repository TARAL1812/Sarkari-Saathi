import { getDb } from '../db/connection.js';
import { nowIso } from '../utils/ids.js';

export function listCategories() {
  return getDb().prepare('SELECT * FROM categories ORDER BY id COLLATE NOCASE').all();
}

export function findCategory(id) {
  return getDb().prepare('SELECT * FROM categories WHERE id = ?').get(id);
}

export function createCategory({ id, description }) {
  const now = nowIso();
  getDb().prepare(`
    INSERT INTO categories (id, description, is_builtin, created_at, updated_at)
    VALUES (?, ?, 0, ?, ?)
  `).run(id, description, now, now);
  return findCategory(id);
}

export function updateCategory(id, { description }) {
  getDb().prepare('UPDATE categories SET description = ?, updated_at = ? WHERE id = ?')
    .run(description, nowIso(), id);
  return findCategory(id);
}

export function deleteCategory(id) {
  getDb().prepare('DELETE FROM categories WHERE id = ?').run(id);
}

export function categoryUsage(id) {
  const db = getDb();
  const official = db.prepare('SELECT COUNT(*) AS n FROM journeys WHERE category = ?').get(id).n;
  const personal = db.prepare('SELECT COUNT(*) AS n FROM user_journeys WHERE category = ?').get(id).n;
  const requests = db.prepare('SELECT COUNT(*) AS n FROM journey_requests WHERE category = ?').get(id).n;
  return { official, personal, requests };
}
