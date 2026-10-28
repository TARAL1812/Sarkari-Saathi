import { getDb } from '../db/connection.js';
import { newId, nowIso } from '../utils/ids.js';

function loadSteps(database, journeyId) {
  const steps = database.prepare(`
    SELECT * FROM journey_steps WHERE journey_id = ? ORDER BY step_number
  `).all(journeyId);

  const docsStmt = database.prepare('SELECT name FROM step_documents WHERE step_id = ? ORDER BY position');
  const problemsStmt = database.prepare('SELECT text FROM step_problems WHERE step_id = ? ORDER BY position');
  const branchStmt = database.prepare('SELECT question, yes_path, no_path FROM step_branches WHERE step_id = ?');

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

export function replaceOfficialSteps(database, journeyId, steps) {
  database.prepare('DELETE FROM journey_steps WHERE journey_id = ?').run(journeyId);
  const insertStep = database.prepare(`
    INSERT INTO journey_steps (
      id, journey_id, step_number, title, description, location, responsible_organization,
      estimated_time, possible_fee, what_happens_next, official_source
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  const insertDoc = database.prepare('INSERT INTO step_documents (step_id, name, position) VALUES (?, ?, ?)');
  const insertProblem = database.prepare('INSERT INTO step_problems (step_id, text, position) VALUES (?, ?, ?)');
  const insertBranch = database.prepare('INSERT INTO step_branches (step_id, question, yes_path, no_path) VALUES (?, ?, ?, ?)');

  steps.forEach((step, index) => {
    const stepId = step.id || newId('step');
    insertStep.run(
      stepId,
      journeyId,
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

export function listOfficialJourneys({ status, q, category, includeArchived = false } = {}) {
  const clauses = [];
  const params = {};
  if (status) {
    clauses.push('status = @status');
    params.status = status;
  } else if (!includeArchived) {
    clauses.push("status != 'archived'");
  }
  if (category) {
    clauses.push('category = @category');
    params.category = category;
  }
  if (q) {
    clauses.push(`(
      title LIKE @q OR description LIKE @q OR organization_name LIKE @q OR department LIKE @q
    )`);
    params.q = `%${q}%`;
  }
  const where = clauses.length ? `WHERE ${clauses.join(' AND ')}` : '';
  return getDb().prepare(`
    SELECT journeys.*,
      (SELECT COUNT(*) FROM journey_steps WHERE journey_id = journeys.id) AS step_count
    FROM journeys ${where} ORDER BY updated_at DESC
  `).all(params);
}

export function findOfficialJourney(id) {
  const row = getDb().prepare('SELECT * FROM journeys WHERE id = ?').get(id);
  if (!row) return null;
  return { ...row, steps: loadSteps(getDb(), id) };
}

export function insertOfficialJourney(fields, steps) {
  const db = getDb();
  const id = fields.id || newId('journey');
  const now = nowIso();
  db.prepare(`
    INSERT INTO journeys (
      id, title, category, country, region, description, target_user,
      organization_name, department, official_website, source_url,
      verification_status, last_verified, location, is_demo, status,
      archived_at, created_at, updated_at, created_by
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NULL, ?, ?, ?)
  `).run(
    id,
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
    fields.verificationStatus || 'unverified',
    fields.lastVerified || '',
    fields.location || '',
    fields.isDemo ? 1 : 0,
    fields.status || 'draft',
    now,
    now,
    fields.createdBy,
  );
  replaceOfficialSteps(db, id, steps);
  return findOfficialJourney(id);
}

export function updateOfficialJourney(id, fields, steps) {
  const db = getDb();
  db.prepare(`
    UPDATE journeys SET
      title = ?, category = ?, country = ?, region = ?, description = ?,
      target_user = ?, organization_name = ?, department = ?, official_website = ?,
      source_url = ?, verification_status = ?, last_verified = ?, location = ?,
      updated_at = ?
    WHERE id = ?
  `).run(
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
    fields.verificationStatus,
    fields.lastVerified || '',
    fields.location || '',
    nowIso(),
    id,
  );
  replaceOfficialSteps(db, id, steps);
  return findOfficialJourney(id);
}

export function setOfficialStatus(id, status) {
  const archivedAt = status === 'archived' ? nowIso() : null;
  getDb().prepare('UPDATE journeys SET status = ?, archived_at = ?, updated_at = ? WHERE id = ?')
    .run(status, archivedAt, nowIso(), id);
  return findOfficialJourney(id);
}

export function deleteOfficialJourney(id) {
  getDb().prepare('DELETE FROM journeys WHERE id = ?').run(id);
}

export function insertVerification({ journeyId, verifiedBy, verificationStatus, sourceUrl, notes }) {
  const id = newId('verify');
  getDb().prepare(`
    INSERT INTO content_verifications (id, journey_id, verified_by, verification_status, source_url, notes, verified_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(id, journeyId, verifiedBy, verificationStatus, sourceUrl || '', notes || '', nowIso());
}

export function listVerifications(journeyId) {
  return getDb().prepare(`
    SELECT * FROM content_verifications WHERE journey_id = ? ORDER BY verified_at DESC
  `).all(journeyId);
}
