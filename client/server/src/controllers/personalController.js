import { getAbroadProfile, updateAbroadProfile } from '../services/abroadService.js';
import {
  createMine,
  getMine,
  listMine,
  removeMine,
  restoreMine,
  updateChecklist,
  updateMine,
  updateProgress,
} from '../services/personalJourneyService.js';
import { getMine as getRequest, listMine as listRequests, submitRequest } from '../services/requestService.js';

export function listJourneys(req, res) {
  res.json({ data: listMine(req.user.id) });
}

export function getJourney(req, res) {
  res.json({ data: getMine(req.user.id, req.params.id) });
}

export function createJourney(req, res) {
  res.status(201).json({ data: createMine(req.user.id, req.body) });
}

export function updateJourney(req, res) {
  res.json({ data: updateMine(req.user.id, req.params.id, req.body) });
}

export function patchProgress(req, res) {
  res.json({ data: updateProgress(req.user.id, req.params.id, req.body) });
}

export function patchChecklist(req, res) {
  res.json({ data: updateChecklist(req.user.id, req.params.id, req.body) });
}

export function deleteJourney(req, res) {
  const hard = req.query.hard === 'true';
  res.json({ data: removeMine(req.user.id, req.params.id, { hard }) });
}

export function restoreJourney(req, res) {
  res.json({ data: restoreMine(req.user.id, req.params.id) });
}

export function getAbroad(req, res) {
  res.json({ data: getAbroadProfile(req.user.id) });
}

export function putAbroad(req, res) {
  res.json({ data: updateAbroadProfile(req.user.id, req.body) });
}

export function createRequest(req, res) {
  res.status(201).json({ data: submitRequest(req.user.id, req.body) });
}

export function listUserRequests(req, res) {
  res.json({ data: listRequests(req.user.id) });
}

export function getUserRequest(req, res) {
  res.json({ data: getRequest(req.user.id, req.params.id) });
}
