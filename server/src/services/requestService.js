import { withTransaction } from '../db/connection.js';
import { httpError } from '../utils/httpError.js';
import { parseOrThrow } from '../utils/validation.js';
import { requestSchema, requestStatusSchema } from '../validators/journey.js';
import { findCategory } from '../repositories/categoryRepository.js';
import { findOfficialJourney } from '../repositories/journeyRepository.js';
import {
  createRequest,
  findOpenDuplicate,
  findRequest,
  listAllRequests,
  listRequestsForUser,
  updateRequestStatus,
} from '../repositories/requestRepository.js';
import { mapRequest } from '../utils/mappers.js';

function ownedRequest(userId, id) {
  const request = findRequest(id);
  if (!request || request.user_id !== userId) {
    throw httpError(404, 'NOT_FOUND', 'That request was not found.');
  }
  return request;
}

export function submitRequest(userId, body) {
  const data = parseOrThrow(requestSchema, body);
  if (data.category && !findCategory(data.category)) {
    throw httpError(400, 'VALIDATION_ERROR', 'Choose one of the existing categories.', {
      fields: { category: 'Choose one of the existing categories.' },
    });
  }
  if (data.relatedJourneyId && !findOfficialJourney(data.relatedJourneyId)) {
    throw httpError(400, 'VALIDATION_ERROR', 'Related journey was not found.', {
      fields: { relatedJourneyId: 'Related journey was not found.' },
    });
  }
  if (findOpenDuplicate(userId, data.title)) {
    throw httpError(409, 'DUPLICATE_REQUEST', 'You already have an open request with this title.');
  }
  return mapRequest(createRequest({ userId, ...data }));
}

export function listMine(userId) {
  return listRequestsForUser(userId).map((row) => mapRequest(findRequest(row.id)));
}

export function getMine(userId, id) {
  return mapRequest(ownedRequest(userId, id));
}

export function adminList(status) {
  return listAllRequests({ status }).map((row) => mapRequest(findRequest(row.id)));
}

export function adminGet(id) {
  const request = findRequest(id);
  if (!request) throw httpError(404, 'NOT_FOUND', 'That request was not found.');
  return mapRequest(request);
}

export function adminUpdateStatus(actorId, id, body) {
  const request = findRequest(id);
  if (!request) throw httpError(404, 'NOT_FOUND', 'That request was not found.');
  const data = parseOrThrow(requestStatusSchema, body);
  if (data.status === request.status) return mapRequest(request);
  return withTransaction(() => mapRequest(updateRequestStatus(id, {
    fromStatus: request.status,
    toStatus: data.status,
    actorId,
    note: data.note,
  })));
}
