const copy = value => JSON.parse(JSON.stringify(value));
const stamp = () => new Date().toISOString();
const id = prefix => `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2,8)}`;

export const deepCopyJourney = copy;

export function createAdminJourney(data, adminId='local-admin') {
  const now=stamp();
  return {...copy(data), id:id('admin'), status:'draft', createdAt:now, updatedAt:now, createdBy:adminId, isDemo:false};
}

export function updateAdminJourney(existing, data) {
  return {...existing, ...copy(data), id:existing.id, createdAt:existing.createdAt, createdBy:existing.createdBy, updatedAt:stamp()};
}

export function cloneJourneyForUser(adminJourney, userId) {
  const now=stamp();
  const clone=copy(adminJourney);
  return {
    ...clone,
    id:id('user'), userId, sourceJourneyId:adminJourney.id,
    title:adminJourney.title, description:adminJourney.description,
    steps:copy(adminJourney.steps||[]), documents:copy(adminJourney.documents||[]), branches:copy(adminJourney.branches||[]),
    completedSteps:[], progress:0, createdAt:now, updatedAt:now,
  };
}

export function updateUserJourneyProgress(journey, completedSteps) {
  const unique=[...new Set(completedSteps)];
  return {...journey, completedSteps:unique, progress:journey.steps?.length?Math.round(unique.length/journey.steps.length*100):0, updatedAt:stamp()};
}
