import { getDb } from '../db/connection.js';
import { newId, nowIso } from '../utils/ids.js';

function loadPersonalSteps(database, userJourneyId) {
  const steps = database.prepare(`
    SELECT * FROM user_journey_steps WHERE user_journey_id = ? ORDER BY step_number
  `).all(userJourneyId);
  const docsStmt = database.prepare('SELECT name FROM user_step_documents WHERE step_id = ? ORDER BY position');
  const problemsStmt = database.prepare('SELECT text FROM user_step_problems WHERE step_id = ? ORDER BY position');
  const branchStmt = database.prepare('SELECT question, yes_path, no_path FROM user_step_branches WHERE step_id = ?');
  return steps.map((step) => {
    const branch = branchStmt.get(step.id);
    return {
      ...step,
      requiredDocuments: docsStmt.all(step.id).map((row) => row.name),
      commonProblems: problemsStmt.all(step.id).map((row) => row.text),
      branch: branch
        ? { question: branch.question, yes: branch.yes_path || '', no: branch.no_path || '' }
        : null,
    };
  });
}

export function replacePersonalSteps(database, userJourneyId, steps) {
  database.prepare('DELETE FROM user_journey_steps WHERE user_journey_id = ?').run(userJourneyId);
  const insertStep = database.prepare(`
    INSERT INTO user_journey_steps (
      id, user_journey_id, step_number, title, description, location, responsible_organization,
      estimated_time, possible_fee, what_happens_next, official_source
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  const insertDoc = database.prepare('INSERT INTO user_step_documents (step_id, name, position) VALUES (?, ?, ?)');
  const insertProblem = database.prepare('INSERT INTO user_step_problems (step_id, text, position) VALUES (?, ?, ?)');
  const insertBranch = database.prepare('INSERT INTO user_step_branches (step_id, question, yes_path, no_path) VALUES (?, ?, ?, ?)');

  steps.forEach((step, index) => {
    const stepId = step.id && String(step.id).startsWith(userJourneyId)
      ? step.id
      : newId('ustep');
    insertStep.run(
      stepId,
      userJourneyId,
      index + 1,
      step.title,
      step.description || '',
      step.location || '',
      step.responsibleOrganization || '',
      step.estimatedTime || 'Not provided',
      step.possibleFee || 'Not provided',
      step.whatHappensNext || '',
      step.officialSource || '',
    );
    (step.requiredDocuments || []).forEach((name, position) => insertDoc.run(stepId, name, position));
    (step.commonProblems || []).forEach((text, position) => insertProblem.run(stepId, text, position));
    if (step.branch?.question) {
      insertBranch.run(stepId, step.branch.question, step.branch.yes || '', step.branch.no || '');
    }
  });
}

export function listPersonalJourneys(userId, { includeArchived = false } = {}) {
  const sql = includeArchived
    ? 'SELECT * FROM user_journeys WHERE user_id = ? ORDER BY updated_at DESC'
    : "SELECT * FROM user_journeys WHERE user_id = ? AND archived_at IS NULL ORDER BY updated_at DESC";
  return getDb().prepare(sql).all(userId);
}

export function findPersonalJourney(id) {
  const row = getDb().prepare('SELECT * FROM user_journeys WHERE id = ?').get(id);
  if (!row) return null;
  const steps = loadPersonalSteps(getDb(), id);
  const completed = getDb().prepare(
    'SELECT step_id FROM user_completed_steps WHERE user_journey_id = ?',
  ).all(id).map((item) => item.step_id);
  const checklist = getDb().prepare(
    'SELECT document_name, completed FROM user_checklist_items WHERE user_journey_id = ?',
  ).all(id);
  return { ...row, steps, completedSteps: completed, checklist };
}

export function insertPersonalJourney(fields, steps) {
  const db = getDb();
  const id = fields.id || newId('uj');
  const now = nowIso();
  db.prepare(`
    INSERT INTO user_journeys (
      id, user_id, source_journey_id, title, category, country, region, description,
      target_user, organization_name, department, official_website, source_url,
      location, progress, archived_at, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, NULL, ?, ?)
  `).run(
    id,
    fields.userId,
    fields.sourceJourneyId || null,
    fields.title,
    fields.category,
    fields.country || '',
    fields.region || '',
    fields.description || '',
    fields.targetUser || '',
    fields.organizationName || '',
    fields.department || '',
    fields.officialWebsite || '',
    fields.sourceUrl || '',
    fields.location || '',
    now,
    now,
  );
  replacePersonalSteps(db, id, steps);
  return findPersonalJourney(id);
}

export function setPersonalProgress(id, progress) {
  getDb().prepare('UPDATE user_journeys SET progress = ?, updated_at = ? WHERE id = ?')
    .run(progress, nowIso(), id);
}

export function setStepCompleted(userJourneyId, stepId, completed) {
  const db = getDb();
  if (completed) {
    db.prepare(`
      INSERT INTO user_completed_steps (user_journey_id, step_id, completed_at)
      VALUES (?, ?, ?)
      ON CONFLICT(user_journey_id, step_id) DO NOTHING
    `).run(userJourneyId, stepId, nowIso());
  } else {
    db.prepare('DELETE FROM user_completed_steps WHERE user_journey_id = ? AND step_id = ?')
      .run(userJourneyId, stepId);
  }
}

export function replaceCompletedSteps(userJourneyId, stepIds) {
  const db = getDb();
  db.prepare('DELETE FROM user_completed_steps WHERE user_journey_id = ?').run(userJourneyId);
  const insert = db.prepare('INSERT INTO user_completed_steps (user_journey_id, step_id, completed_at) VALUES (?, ?, ?)');
  const now = nowIso();
  for (const stepId of stepIds) insert.run(userJourneyId, stepId, now);
}

export function upsertChecklistItem(userJourneyId, documentName, completed) {
  getDb().prepare(`
    INSERT INTO user_checklist_items (user_journey_id, document_name, completed, updated_at)
    VALUES (?, ?, ?, ?)
    ON CONFLICT(user_journey_id, document_name) DO UPDATE SET completed = excluded.completed, updated_at = excluded.updated_at
  `).run(userJourneyId, documentName, completed ? 1 : 0, nowIso());
}

export function archivePersonalJourney(id) {
  getDb().prepare('UPDATE user_journeys SET archived_at = ?, updated_at = ? WHERE id = ?')
    .run(nowIso(), nowIso(), id);
}

export function restorePersonalJourney(id) {
  getDb().prepare('UPDATE user_journeys SET archived_at = NULL, updated_at = ? WHERE id = ?')
    .run(nowIso(), id);
}

export function deletePersonalJourney(id) {
  getDb().prepare('DELETE FROM user_journeys WHERE id = ?').run(id);
}

export function personalStepExists(userJourneyId, stepId) {
  return getDb().prepare(
    'SELECT id FROM user_journey_steps WHERE user_journey_id = ? AND id = ?',
  ).get(userJourneyId, stepId);
}
