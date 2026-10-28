import assert from 'node:assert/strict';
import { afterEach, beforeEach, describe, it } from 'node:test';
import { closeDb } from '../src/db/connection.js';
import { makeUser, setupApp, signedInAgent, validJourney } from './helpers.js';

describe('personal journeys', () => {
  let app;
  let admin;
  let alice;
  let bob;

  beforeEach(async () => {
    ({ app } = setupApp());
    await makeUser({ email: 'admin@example.com', role: 'admin' });
    await makeUser({ email: 'alice@example.com', name: 'Alice' });
    await makeUser({ email: 'bob@example.com', name: 'Bob' });
    admin = await signedInAgent(app, 'admin@example.com');
    alice = await signedInAgent(app, 'alice@example.com');
    bob = await signedInAgent(app, 'bob@example.com');
  });
  afterEach(() => closeDb());

  async function createPublishedGuide() {
    const created = await admin.post('/api/admin/journeys').send(validJourney());
    assert.equal(created.status, 201);
    const published = await admin.patch(`/api/admin/journeys/${created.body.data.id}/status`).send({ status: 'published' });
    assert.equal(published.status, 200);
    return published.body.data;
  }

  it('blocks custom plan creation while tracking a saved guide and checklist', async () => {
    const custom = await alice.post('/api/me/journeys').send(validJourney());
    assert.equal(custom.status, 403);
    assert.equal(custom.body.error.code, 'PERSONAL_GUIDE_REQUIRED');

    const source = await createPublishedGuide();
    const created = await alice.post('/api/me/journeys').send({ sourceJourneyId: source.id });
    assert.equal(created.status, 201);
    const id = created.body.data.id;
    const stepId = created.body.data.steps[0].id;

    const progressed = await alice.patch(`/api/me/journeys/${id}/progress`).send({ stepId, completed: true });
    assert.equal(progressed.body.data.completedSteps.includes(stepId), true);
    assert.ok(progressed.body.data.progress > 0);

    const checklist = await alice.put(`/api/me/journeys/${id}/checklist`).send({
      documentName: 'Document A',
      completed: true,
    });
    assert.equal(checklist.body.data.checklist.find((item) => item.name === 'Document A').completed, true);

    const edit = await alice.put(`/api/me/journeys/${id}`).send(validJourney({ title: 'Edited copy' }));
    assert.equal(edit.status, 403);

    const listed = await alice.get('/api/me/journeys');
    assert.equal(listed.body.data.length, 1);
  });

  it('clones a published journey into an independent personal copy', async () => {
    const source = await createPublishedGuide();
    const cloned = await alice.post('/api/me/journeys').send({ sourceJourneyId: source.id });
    assert.equal(cloned.status, 201);
    assert.equal(cloned.body.data.sourceJourneyId, source.id);
    assert.notEqual(cloned.body.data.id, source.id);
    assert.ok(cloned.body.data.steps.length >= 1);
  });

  it('prevents access to another user\'s personal journey', async () => {
    const source = await createPublishedGuide();
    const created = await alice.post('/api/me/journeys').send({ sourceJourneyId: source.id });
    const id = created.body.data.id;
    const peek = await bob.get(`/api/me/journeys/${id}`);
    assert.equal(peek.status, 404);
    const mutate = await bob.patch(`/api/me/journeys/${id}/progress`).send({
      stepId: created.body.data.steps[0].id,
      completed: true,
    });
    assert.equal(mutate.status, 404);
  });

  it('archives a personal journey and restores it', async () => {
    const source = await createPublishedGuide();
    const created = await alice.post('/api/me/journeys').send({ sourceJourneyId: source.id });
    const id = created.body.data.id;
    const archived = await alice.delete(`/api/me/journeys/${id}`);
    assert.equal(archived.body.data.archived, true);
    const listed = await alice.get('/api/me/journeys');
    assert.equal(listed.body.data.length, 0);
    const restored = await alice.post(`/api/me/journeys/${id}/restore`).send({});
    assert.equal(restored.status, 200);
    assert.equal((await alice.get('/api/me/journeys')).body.data.length, 1);
  });

  it('persists living-abroad task progress', async () => {
    const saved = await alice.put('/api/me/abroad').send({
      mode: true,
      tasks: [
        { id: 'aadhaar', title: 'Aadhaar-related work', progress: 40 },
        { id: 'pan', title: 'PAN-related service', progress: 10 },
        { id: 'banking', title: 'Banking / KYC', progress: 0 },
        { id: 'government', title: 'Government documentation', progress: 5 },
      ],
    });
    assert.equal(saved.body.data.mode, true);
    assert.equal(saved.body.data.tasks[0].progress, 40);
    const loaded = await alice.get('/api/me/abroad');
    assert.equal(loaded.body.data.tasks[0].progress, 40);
  });
});
