import assert from 'node:assert/strict';
import { afterEach, beforeEach, describe, it } from 'node:test';
import { closeDb } from '../src/db/connection.js';
import { makeUser, setupApp, signedInAgent } from './helpers.js';

describe('journey requests', () => {
  let app;
  let user;
  let admin;

  beforeEach(async () => {
    ({ app } = setupApp());
    await makeUser({ email: 'user@example.com' });
    await makeUser({ email: 'admin@example.com', role: 'admin' });
    user = await signedInAgent(app, 'user@example.com');
    admin = await signedInAgent(app, 'admin@example.com');
  });
  afterEach(() => closeDb());

  it('submits a request, blocks duplicates, and records admin review history', async () => {
    const payload = {
      title: 'Need a passport renewal map',
      description: 'Please add a demo journey covering passport renewal preparation.',
      category: 'Government',
    };
    const created = await user.post('/api/me/requests').send(payload);
    assert.equal(created.status, 201);
    assert.equal(created.body.data.status, 'submitted');
    assert.equal(created.body.data.history.length, 1);

    const dup = await user.post('/api/me/requests').send(payload);
    assert.equal(dup.status, 409);

    const id = created.body.data.id;
    const adminList = await admin.get('/api/admin/requests');
    assert.equal(adminList.body.data.some((item) => item.id === id), true);

    const reviewed = await admin.patch(`/api/admin/requests/${id}`).send({
      status: 'under_review',
      note: 'Looking at this request.',
    });
    assert.equal(reviewed.body.data.status, 'under_review');
    assert.equal(reviewed.body.data.history.length, 2);

    const mine = await user.get(`/api/me/requests/${id}`);
    assert.equal(mine.body.data.status, 'under_review');
  });

  it('hides other users\' requests from citizens', async () => {
    await makeUser({ email: 'other@example.com' });
    const other = await signedInAgent(app, 'other@example.com');
    const created = await user.post('/api/me/requests').send({
      title: 'Private request title',
      description: 'This request belongs only to the original user.',
    });
    const peek = await other.get(`/api/me/requests/${created.body.data.id}`);
    assert.equal(peek.status, 404);
    const asUser = await user.get('/api/admin/requests');
    assert.equal(asUser.status, 403);
  });
});
