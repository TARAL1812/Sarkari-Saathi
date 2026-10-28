import assert from 'node:assert/strict';
import { afterEach, beforeEach, describe, it } from 'node:test';
import { closeDb } from '../src/db/connection.js';
import { anonymousAgent, makeUser, setupApp, signedInAgent, validJourney } from './helpers.js';

describe('public catalog', () => {
  let app;
  let agent;
  let admin;
  let user;

  beforeEach(async () => {
    ({ app } = setupApp());
    agent = anonymousAgent(app);
    await makeUser({ email: 'admin@example.com', role: 'admin' });
    await makeUser({ email: 'user@example.com' });
    admin = await signedInAgent(app, 'admin@example.com');
    user = await signedInAgent(app, 'user@example.com');
  });
  afterEach(() => closeDb());

  async function createPublishedGuide(data = {}) {
    const created = await admin.post('/api/admin/journeys').send(validJourney(data));
    assert.equal(created.status, 201);
    const response = await admin.patch(`/api/admin/journeys/${created.body.data.id}/status`).send({ status: 'published' });
    assert.equal(response.status, 200);
    return response.body.data;
  }

  it('lists the non-demo service and certificate overview guides', async () => {
    const categories = await agent.get('/api/categories');
    assert.equal(categories.status, 200);
    assert.ok(categories.body.data.find((item) => item.id === 'Government'));
    assert.ok(categories.body.data.find((item) => item.id === 'Agriculture'));
    assert.ok(categories.body.data.find((item) => item.id === 'Food'));

    const journeys = await agent.get('/api/journeys');
    assert.equal(journeys.status, 200);
    assert.deepEqual(
      journeys.body.data.map((item) => item.id).sort(),
      [
        'guide-aadhaar-download',
        'guide-aadhaar-enrolment',
        'guide-aadhaar-update',
        'guide-abha-health-account',
        'guide-birth-certificate',
        'guide-caste-certificate',
        'guide-domicile-certificate',
        'guide-driving-licence',
        'guide-fssai-food-business',
        'guide-income-certificate',
        'guide-insurance-claim',
        'guide-kyc',
        'guide-pm-kisan-registration',
        'guide-pmjay-beneficiary',
        'guide-scholarship-application',
        'guide-soil-health-card',
        'guide-udid-disability-certificate',
      ],
    );
    assert.ok(journeys.body.data.every((item) => item.status === 'published' && !item.isDemo));
  });

  it('filters and searches published journeys', async () => {
    const created = await createPublishedGuide({ title: 'Clinic Certificate Service', category: 'Healthcare' });
    const healthcare = await agent.get('/api/journeys?category=Healthcare');
    assert.equal(healthcare.body.data.length, 4);
    assert.ok(healthcare.body.data.some((item) => item.id === created.id));

    const search = await agent.get('/api/journeys?q=clinic');
    assert.ok(search.body.data.some((item) => item.id === created.id));
  });

  it('returns journey details, steps, documents, and branches', async () => {
    const created = await createPublishedGuide();
    const detail = await user.get(`/api/journeys/${created.id}`);
    assert.equal(detail.status, 200);
    assert.ok(detail.body.data.steps.length >= 2);
    assert.equal(detail.body.data.createdBy, undefined);

    const steps = await user.get(`/api/journeys/${created.id}/steps`);
    assert.equal(steps.body.data[0].title, 'First step');

    const docs = await user.get(`/api/journeys/${created.id}/documents`);
    assert.ok(docs.body.data.some((item) => item.name === 'Document A'));

    const branches = await user.get(`/api/journeys/${created.id}/branches`);
    assert.equal(branches.body.data[0].question, 'Do you have it?');
  });

  it('requires sign-in to open service details or retrieve service data', async () => {
    for (const path of [
      '/api/journeys/guide-aadhaar-enrolment',
      '/api/journeys/guide-aadhaar-enrolment/steps',
      '/api/journeys/guide-aadhaar-enrolment/documents',
      '/api/journeys/guide-aadhaar-enrolment/branches',
    ]) {
      assert.equal((await agent.get(path)).status, 401);
    }
  });

  it('returns 404 for missing or unpublished ids to signed-in callers', async () => {
    const anonymousMissing = await agent.get('/api/journeys/does-not-exist');
    assert.equal(anonymousMissing.status, 401);
    const signedInMissing = await user.get('/api/journeys/does-not-exist');
    assert.equal(signedInMissing.status, 404);
  });
});
