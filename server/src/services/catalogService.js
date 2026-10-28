import { httpError } from '../utils/httpError.js';
import { parseOrThrow } from '../utils/validation.js';
import { catalogQuerySchema } from '../validators/journey.js';
import { listCategories } from '../repositories/categoryRepository.js';
import { findOfficialJourney, listOfficialJourneys } from '../repositories/journeyRepository.js';
import { mapCategory, mapOfficialJourney, mapOfficialSummary } from '../utils/mappers.js';

export function getPublicCategories() {
  return listCategories().map(mapCategory);
}

export function getPublishedJourneys(query) {
  const { q, category } = parseOrThrow(catalogQuerySchema, query);
  return listOfficialJourneys({
    status: 'published',
    q: q || undefined,
    category: category || undefined,
  }).map(mapOfficialSummary);
}

export function getPublishedJourney(id) {
  const journey = findOfficialJourney(id);
  if (!journey || journey.status !== 'published') {
    throw httpError(404, 'NOT_FOUND', 'That journey was not found.');
  }
  return mapOfficialJourney(journey);
}

export function getPublishedSteps(id) {
  return getPublishedJourney(id).steps;
}

export function getPublishedDocuments(id) {
  const journey = getPublishedJourney(id);
  const names = [...new Set(journey.steps.flatMap((step) => step.requiredDocuments).filter(Boolean))];
  return names.map((name) => ({ name, mandatory: true }));
}

export function getPublishedBranches(id) {
  return getPublishedJourney(id).steps
    .filter((step) => step.branch)
    .map((step) => ({ stepId: step.id, stepTitle: step.title, ...step.branch }));
}
