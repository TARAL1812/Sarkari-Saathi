import {
  adminCreateCategory,
  adminCreateJourney,
  adminDeleteCategory,
  adminDeleteJourney,
  adminGetJourney,
  adminListCategories,
  adminListJourneys,
  adminListVerifications,
  adminSetStatus,
  adminUpdateCategory,
  adminUpdateJourney,
} from '../services/adminService.js';
import { adminGet, adminList, adminUpdateStatus } from '../services/requestService.js';

export function listJourneys(_req, res) {
  res.json({ data: adminListJourneys() });
}

export function getJourney(req, res) {
  res.json({ data: adminGetJourney(req.params.id) });
}

export function createJourney(req, res) {
  res.status(201).json({ data: adminCreateJourney(req.user.id, req.body) });
}

export function updateJourney(req, res) {
  res.json({ data: adminUpdateJourney(req.params.id, req.user.id, req.body) });
}

export function setStatus(req, res) {
  res.json({ data: adminSetStatus(req.params.id, req.body) });
}

export function deleteJourney(req, res) {
  res.json({ data: adminDeleteJourney(req.params.id) });
}

export function createCategory(req, res) {
  res.status(201).json({ data: adminCreateCategory(req.body) });
}

export function updateCategory(req, res) {
  res.json({ data: adminUpdateCategory(req.params.id, req.body) });
}

export function removeCategory(req, res) {
  res.json({ data: adminDeleteCategory(req.params.id) });
}

export function listCategories(_req, res) {
  res.json({ data: adminListCategories() });
}

export function listVerifications(req, res) {
  res.json({ data: adminListVerifications(req.params.id) });
}

export function listRequests(req, res) {
  res.json({ data: adminList(req.query.status) });
}

export function getRequest(req, res) {
  res.json({ data: adminGet(req.params.id) });
}

export function updateRequest(req, res) {
  res.json({ data: adminUpdateStatus(req.user.id, req.params.id, req.body) });
}
