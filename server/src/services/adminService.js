import { withTransaction } from '../db/connection.js';
import { httpError } from '../utils/httpError.js';
import { parseOrThrow } from '../utils/validation.js';
import { categorySchema, categoryUpdateSchema, officialJourneySchema, statusSchema } from '../validators/journey.js';
import {
  categoryUsage,
  createCategory,
  deleteCategory,
  findCategory,
  listCategories,
  updateCategory,
} from '../repositories/categoryRepository.js';
import {
  deleteOfficialJourney,
  findOfficialJourney,
  insertOfficialJourney,
  insertVerification,
  listOfficialJourneys,
  listVerifications,
  setOfficialStatus,
  updateOfficialJourney,
} from '../repositories/journeyRepository.js';
import { mapCategory, mapOfficialJourney } from '../utils/mappers.js';
import { countAdminUsers, deleteUser, findUserById, getAdminUserOverview } from '../repositories/userRepository.js';

function requireCategory(id) {
  if (!findCategory(id)) {
    throw httpError(400, 'VALIDATION_ERROR', 'Choose one of the existing categories.', {
      fields: { category: 'Choose one of the existing categories.' },
    });
  }
}

function requireJourney(id) {
  const journey = findOfficialJourney(id);
  if (!journey) throw httpError(404, 'NOT_FOUND', 'That journey was not found.');
  return journey;
}

export function adminListJourneys() {
  return listOfficialJourneys({ includeArchived: true }).map((row) => {
    const full = findOfficialJourney(row.id);
    return mapOfficialJourney(full, { admin: true });
  });
}

export function adminGetJourney(id) {
  return mapOfficialJourney(requireJourney(id), { admin: true });
}

export function adminCreateJourney(actorId, body) {
  const data = parseOrThrow(officialJourneySchema, body);
  requireCategory(data.category);
  return withTransaction(() => {
    const created = insertOfficialJourney({ ...data, createdBy: actorId, status: 'draft', isDemo: false }, data.steps);
    return mapOfficialJourney(created, { admin: true });
  });
}

export function adminUpdateJourney(id, actorId, body) {
  const existing = requireJourney(id);
  const data = parseOrThrow(officialJourneySchema, body);
  requireCategory(data.category);
  return withTransaction(() => {
    const updated = updateOfficialJourney(id, { ...data, verificationStatus: data.verificationStatus }, data.steps);
    if (existing.verification_status !== data.verificationStatus || existing.last_verified !== data.lastVerified) {
      insertVerification({
        journeyId: id,
        verifiedBy: actorId,
        verificationStatus: data.verificationStatus,
        sourceUrl: data.sourceUrl || data.officialWebsite,
        notes: 'Updated via admin journey save',
      });
    }
    return mapOfficialJourney(updated, { admin: true });
  });
}

export function adminSetStatus(id, body) {
  requireJourney(id);
  const { status } = parseOrThrow(statusSchema, body);
  return mapOfficialJourney(setOfficialStatus(id, status), { admin: true });
}

export function adminDeleteJourney(id) {
  const journey = requireJourney(id);
  if (journey.status !== 'archived') {
    return mapOfficialJourney(setOfficialStatus(id, 'archived'), { admin: true });
  }
  deleteOfficialJourney(id);
  return { deleted: true, id };
}

export function adminCreateCategory(body) {
  const data = parseOrThrow(categorySchema, body);
  if (findCategory(data.id)) {
    throw httpError(409, 'CATEGORY_EXISTS', 'That category already exists.', {
      fields: { id: 'That category already exists.' },
    });
  }
  return mapCategory(createCategory(data));
}

export function adminUpdateCategory(id, body) {
  const existing = findCategory(id);
  if (!existing) throw httpError(404, 'NOT_FOUND', 'That category was not found.');
  const data = parseOrThrow(categoryUpdateSchema, body);
  return mapCategory(updateCategory(id, data));
}

export function adminDeleteCategory(id) {
  const existing = findCategory(id);
  if (!existing) throw httpError(404, 'NOT_FOUND', 'That category was not found.');
  if (existing.is_builtin) {
    throw httpError(400, 'BUILTIN_CATEGORY', 'Built-in categories cannot be deleted.');
  }
  const usage = categoryUsage(id);
  if (usage.official || usage.personal || usage.requests) {
    throw httpError(409, 'CATEGORY_IN_USE', 'This category is still used by journeys or requests.');
  }
  deleteCategory(id);
  return { deleted: true, id };
}

export function adminListCategories() {
  return listCategories().map((row) => ({ ...mapCategory(row), usage: categoryUsage(row.id) }));
}

export function adminListVerifications(id) {
  requireJourney(id);
  return listVerifications(id);
}

export function adminGetUserOverview() {
  return getAdminUserOverview();
}

export function adminDeleteUser(actorId, userId) {
  return withTransaction(() => {
    const user = findUserById(userId);
    if (!user) throw httpError(404, 'NOT_FOUND', 'That account was not found.');
    if (user.id === actorId) {
      throw httpError(400, 'CANNOT_DELETE_SELF', 'You cannot delete your own administrator account.');
    }
    if (user.role === 'admin' && countAdminUsers() <= 1) {
      throw httpError(409, 'LAST_ADMIN', 'The last administrator account cannot be deleted.');
    }
    deleteUser(userId);
    return { deleted: true, id: userId };
  });
}
