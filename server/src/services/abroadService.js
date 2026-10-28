import { parseOrThrow } from '../utils/validation.js';
import { abroadSchema } from '../validators/journey.js';
import { getAbroad, saveAbroad } from '../repositories/abroadRepository.js';

export function getAbroadProfile(userId) {
  return getAbroad(userId);
}

export function updateAbroadProfile(userId, body) {
  const data = parseOrThrow(abroadSchema, body);
  return saveAbroad(userId, data);
}
