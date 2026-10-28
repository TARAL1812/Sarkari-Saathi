import { getDb } from '../db/connection.js';
import { newId, nowIso } from '../utils/ids.js';

export function createRequest(fields) {
  const id = newId('req');
  const now = nowIso();
  const db = getDb();
  db.prepare(`
    INSERT INTO journey_requests (
      id, user_id, title, description, category, related_journey_id, status, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, 'submitted', ?, ?)
  `).run(
    id,
    fields.userId,
    fields.title,
    fields.description,
    fields.category || null,
    fields.relatedJourneyId || null,
    now,
    now,
  );
  db.prepare(`
    INSERT INTO journey_request_history (request_id, from_status, to_status, actor_id, note, created_at)
    VALUES (?, NULL, 'submitted', ?, ?, ?)
  `).run(id, fields.userId, fields.note || 'Submitted', now);
  return findRequest(id);
}

export function findRequest(id) {
  const row = getDb().prepare('SELECT * FROM journey_requests WHERE id = ?').get(id);
  if (!row) return null;
  const history = getDb().prepare(`
    SELECT * FROM journey_request_history WHERE request_id = ? ORDER BY id
  `).all(id);
  return { ...row, history };
}

export function listRequestsForUser(userId) {
  return getDb().prepare('SELECT * FROM journey_requests WHERE user_id = ? ORDER BY updated_at DESC').all(userId);
}

export function listAllRequests({ status } = {}) {
  if (status) {
    return getDb().prepare('SELECT * FROM journey_requests WHERE status = ? ORDER BY updated_at DESC').all(status);
  }
  return getDb().prepare('SELECT * FROM journey_requests ORDER BY updated_at DESC').all();
}

export function findOpenDuplicate(userId, title) {
  return getDb().prepare(`
    SELECT * FROM journey_requests
    WHERE user_id = ? AND title = ? COLLATE NOCASE
      AND status IN ('submitted', 'under_review')
  `).get(userId, title);
}

export function updateRequestStatus(id, { fromStatus, toStatus, actorId, note }) {
  const now = nowIso();
  getDb().prepare('UPDATE journey_requests SET status = ?, updated_at = ? WHERE id = ?')
    .run(toStatus, now, id);
  getDb().prepare(`
    INSERT INTO journey_request_history (request_id, from_status, to_status, actor_id, note, created_at)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(id, fromStatus, toStatus, actorId, note || '', now);
  return findRequest(id);
}
