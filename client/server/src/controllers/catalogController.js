import {
  getPublicCategories,
  getPublishedBranches,
  getPublishedDocuments,
  getPublishedJourney,
  getPublishedJourneys,
  getPublishedSteps,
} from '../services/catalogService.js';

export function listCategories(_req, res) {
  res.json({ data: getPublicCategories() });
}

export function listJourneys(req, res) {
  res.json({ data: getPublishedJourneys(req.query) });
}

export function getJourney(req, res) {
  res.json({ data: getPublishedJourney(req.params.id) });
}

export function getSteps(req, res) {
  res.json({ data: getPublishedSteps(req.params.id) });
}

export function getDocuments(req, res) {
  res.json({ data: getPublishedDocuments(req.params.id) });
}

export function getBranches(req, res) {
  res.json({ data: getPublishedBranches(req.params.id) });
}
