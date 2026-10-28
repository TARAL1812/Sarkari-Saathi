import { withTransaction } from '../db/connection.js';
import { httpError } from '../utils/httpError.js';
import { parseOrThrow } from '../utils/validation.js';
import { checklistSchema, progressSchema } from '../validators/journey.js';
import { findOfficialJourney } from '../repositories/journeyRepository.js';
import {
  archivePersonalJourney,
  deletePersonalJourney,
  findPersonalJourney,
  insertPersonalJourney,
  listPersonalJourneys,
  personalStepExists,
  replaceCompletedSteps,
  restorePersonalJourney,
  setPersonalProgress,
  setStepCompleted,
  upsertChecklistItem,
} from '../repositories/personalJourneyRepository.js';
import { mapPersonalJourney } from '../utils/mappers.js';

function owned(userId, id) {
  const journey = findPersonalJourney(id);
  if (!journey || journey.user_id !== userId) {
    throw httpError(404, 'NOT_FOUND', 'That personal journey was not found.');
  }
  return journey;
}

function refreshProgress(id) {
  const journey = findPersonalJourney(id);
  const total = journey.steps.length || 0;
  const progress = total ? Math.round((journey.completedSteps.length / total) * 100) : 0;
  setPersonalProgress(id, progress);
  return findPersonalJourney(id);
}

export function listMine(userId) {
  return listPersonalJourneys(userId).map((row) => mapPersonalJourney(findPersonalJourney(row.id)));
}

export function getMine(userId, id) {
  return mapPersonalJourney(owned(userId, id));
}

export function createMine(userId, body) {
  if (!body?.sourceJourneyId) {
    throw httpError(403, 'PERSONAL_GUIDE_REQUIRED', 'Users can save published guides but cannot create custom plans.');
  }

  const source = findOfficialJourney(body.sourceJourneyId);
  if (!source || source.status !== 'published') {
    throw httpError(404, 'NOT_FOUND', 'That published guide was not found.');
  }
  return withTransaction(() => mapPersonalJourney(insertPersonalJourney({
    userId,
    sourceJourneyId: source.id,
    title: source.title,
    category: source.category,
    country: source.country,
    region: source.region,
    description: source.description,
    targetUser: source.target_user,
    organizationName: source.organization_name,
    department: source.department,
    officialWebsite: source.official_website,
    sourceUrl: source.source_url,
    location: source.location,
  }, source.steps.map((step) => ({
    title: step.title,
    description: step.description,
    requiredDocuments: step.requiredDocuments,
    location: step.location,
    responsibleOrganization: step.responsible_organization,
    estimatedTime: step.estimated_time,
    possibleFee: step.possible_fee,
    whatHappensNext: step.what_happens_next,
    officialSource: step.official_source,
    commonProblems: step.commonProblems,
    branch: step.branch,
  })))));
}

export function updateMine(userId, id) {
  owned(userId, id);
  throw httpError(403, 'SAVED_GUIDE_READ_ONLY', 'Saved guide content cannot be edited; track progress with its checklist instead.');
}

export function updateProgress(userId, id, body) {
  const journey = owned(userId, id);
  const data = parseOrThrow(progressSchema, body);
  return withTransaction(() => {
    if (data.completedSteps) {
      for (const stepId of data.completedSteps) {
        if (!personalStepExists(id, stepId)) {
          throw httpError(400, 'INVALID_STEP', 'One or more step ids do not belong to this journey.');
        }
      }
      replaceCompletedSteps(id, [...new Set(data.completedSteps)]);
    } else {
      if (!personalStepExists(id, data.stepId)) {
        throw httpError(400, 'INVALID_STEP', 'That step does not belong to this journey.');
      }
      const currentlyDone = journey.completedSteps.includes(data.stepId);
      const completed = data.completed === undefined ? !currentlyDone : data.completed;
      setStepCompleted(id, data.stepId, completed);
    }
    return mapPersonalJourney(refreshProgress(id));
  });
}

export function updateChecklist(userId, id, body) {
  const journey = owned(userId, id);
  const data = parseOrThrow(checklistSchema, body);
  const allowed = new Set(journey.steps.flatMap((step) => step.requiredDocuments));
  const items = data.items || [{ name: data.documentName, completed: Boolean(data.completed) }];
  return withTransaction(() => {
    for (const item of items) {
      if (!allowed.has(item.name)) {
        throw httpError(400, 'INVALID_DOCUMENT', `Document "${item.name}" is not on this journey checklist.`);
      }
      upsertChecklistItem(id, item.name, item.completed);
    }
    return mapPersonalJourney(findPersonalJourney(id));
  });
}

export function removeMine(userId, id, { hard = false } = {}) {
  owned(userId, id);
  if (hard) {
    deletePersonalJourney(id);
    return { deleted: true, id };
  }
  archivePersonalJourney(id);
  return { archived: true, id };
}

export function restoreMine(userId, id) {
  owned(userId, id);
  restorePersonalJourney(id);
  return mapPersonalJourney(findPersonalJourney(id));
}
