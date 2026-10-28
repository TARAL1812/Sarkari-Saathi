import { getDb } from '../db/connection.js';
import { nowIso } from '../utils/ids.js';
import { DEFAULT_ABROAD_TASKS } from '../db/seedData.js';

export function getAbroad(userId) {
  const db = getDb();
  const settings = db.prepare('SELECT * FROM user_abroad_settings WHERE user_id = ?').get(userId);
  const tasks = db.prepare('SELECT task_id AS id, title, progress FROM user_abroad_tasks WHERE user_id = ?').all(userId);
  if (!settings && tasks.length === 0) {
    return { mode: false, tasks: DEFAULT_ABROAD_TASKS.map((task) => ({ ...task })) };
  }
  const merged = DEFAULT_ABROAD_TASKS.map((defaultTask) => {
    const saved = tasks.find((task) => task.id === defaultTask.id);
    return saved || { ...defaultTask };
  });
  for (const task of tasks) {
    if (!merged.some((item) => item.id === task.id)) merged.push(task);
  }
  return { mode: Boolean(settings?.mode), tasks: merged };
}

export function saveAbroad(userId, { mode, tasks }) {
  const db = getDb();
  const now = nowIso();
  db.prepare(`
    INSERT INTO user_abroad_settings (user_id, mode, updated_at)
    VALUES (?, ?, ?)
    ON CONFLICT(user_id) DO UPDATE SET mode = excluded.mode, updated_at = excluded.updated_at
  `).run(userId, mode ? 1 : 0, now);
  db.prepare('DELETE FROM user_abroad_tasks WHERE user_id = ?').run(userId);
  const insert = db.prepare(`
    INSERT INTO user_abroad_tasks (user_id, task_id, title, progress) VALUES (?, ?, ?, ?)
  `);
  for (const task of tasks) {
    insert.run(userId, task.id, task.title, task.progress);
  }
  return getAbroad(userId);
}
