import assert from 'node:assert/strict';
import { afterEach, beforeEach, describe, it } from 'node:test';
import { closeDb } from '../src/db/connection.js';
import { findOfficialJourney } from '../src/repositories/journeyRepository.js';
import { anonymousAgent, makeUser, PASSWORD, setupApp, signedInAgent, validJourney } from './helpers.js';

describe('administrator management', () => {
  let app;
  let admin;
  let user;

  beforeEach(async () => {
    ({ app } = setupApp());
    await makeUser({ email: 'admin@example.com', role: 'admin' });
    await makeUser({ email: 'user@example.com', role: 'user' });
    admin = await signedInAgent(app, 'admin@example.com');
    user = await signedInAgent(app, 'user@example.com');
  });
  afterEach(() => closeDb());

  it('blocks anonymous and non-admin callers', async () => {
    const anon = await anonymousAgent(app).get('/api/admin/journeys');
    assert.equal(anon.status, 401);
    const forbidden = await user.get('/api/admin/journeys');
    assert.equal(forbidden.status, 403);
    const create = await user.post('/api/admin/journeys').send(validJourney());
    assert.equal(create.status, 403);
    const reset = await user.post('/api/admin/users/nope/temporary-password').send({ currentPassword: PASSWORD });
    assert.equal(reset.status, 403);
    const deleteAccount = await user.delete('/api/admin/users/nope');
    assert.equal(deleteAccount.status, 403);
    assert.equal((await anonymousAgent(app).get('/api/admin/users/overview')).status, 401);
    assert.equal((await user.get('/api/admin/users/overview')).status, 403);
  });

  it('returns account and login summaries without credential data', async () => {
    const response = await admin.get('/api/admin/users/overview');
    assert.equal(response.status, 200);
    assert.equal(response.body.data.totalAccounts, 2);
    assert.equal(response.body.data.activeUsers, 2);
    assert.equal(response.body.data.successfulLogins, 2);
    assert.equal(response.body.data.users.length, 2);
    for (const account of response.body.data.users) {
      assert.equal(Object.hasOwn(account, 'password'), false);
      assert.equal(Object.hasOwn(account, 'passwordHash'), false);
      assert.equal(Object.hasOwn(account, 'password_hash'), false);
    }
  });

  it('deletes an account and revokes its sessions without allowing self-deletion', async () => {
    const overview = await admin.get('/api/admin/users/overview');
    const userId = overview.body.data.users.find((account) => account.email === 'user@example.com').id;
    const selfDelete = await admin.delete(`/api/admin/users/${overview.body.data.users.find((account) => account.email === 'admin@example.com').id}`);
    assert.equal(selfDelete.status, 400);
    assert.equal(selfDelete.body.error.code, 'CANNOT_DELETE_SELF');

    const deleted = await admin.delete(`/api/admin/users/${userId}`);
    assert.equal(deleted.status, 200);
    assert.deepEqual(deleted.body.data, { deleted: true, id: userId });
    assert.equal((await user.get('/api/auth/me')).status, 401);
    const refreshedOverview = await admin.get('/api/admin/users/overview');
    assert.equal(refreshedOverview.body.data.totalAccounts, 1);
    assert.equal(refreshedOverview.body.data.users.some((account) => account.id === userId), false);

    const missing = await admin.delete(`/api/admin/users/${userId}`);
    assert.equal(missing.status, 404);
  });

  it('resets an account with a one-time password and requires it to be changed', async () => {
    const denied = await admin.post(`/api/admin/users/${encodeURIComponent('user@example.com')}/temporary-password`)
      .send({ currentPassword: 'IncorrectPassword123' });
    assert.equal(denied.status, 401);

    const userId = (await admin.get('/api/admin/users/overview')).body.data.users
      .find((account) => account.email === 'user@example.com').id;
    const reset = await admin.post(`/api/admin/users/${userId}/temporary-password`)
      .send({ currentPassword: PASSWORD });
    assert.equal(reset.status, 200);
    assert.equal(reset.body.data.email, 'user@example.com');
    assert.match(reset.body.data.temporaryPassword, /[A-Za-z]/);
    assert.match(reset.body.data.temporaryPassword, /[0-9]/);
    assert.equal(Object.hasOwn(reset.body.data, 'passwordHash'), false);

    assert.equal((await user.get('/api/me/journeys')).status, 401);
    const temporaryLogin = await anonymousAgent(app).post('/api/auth/login').send({
      email: 'user@example.com',
      password: reset.body.data.temporaryPassword,
    });
    assert.equal(temporaryLogin.status, 200);
    assert.equal(temporaryLogin.body.data.user.mustChangePassword, true);

    const temporaryAgent = await signedInAgent(app, 'user@example.com', reset.body.data.temporaryPassword);
    const restricted = await temporaryAgent.get('/api/me/journeys');
    assert.equal(restricted.status, 403);
    assert.equal(restricted.body.error.code, 'PASSWORD_CHANGE_REQUIRED');

    const changed = await temporaryAgent.post('/api/auth/change-password').send({
      currentPassword: reset.body.data.temporaryPassword,
      newPassword: 'NewSecurePass123',
    });
    assert.equal(changed.status, 200);
    assert.equal(changed.body.data.user.mustChangePassword, false);
    assert.equal((await temporaryAgent.get('/api/me/journeys')).status, 200);
  });

  it('creates, edits, publishes, archives, and retrieves journeys', async () => {
    const created = await admin.post('/api/admin/journeys').send(validJourney());
    assert.equal(created.status, 201);
    assert.equal(created.body.data.status, 'draft');
    const id = created.body.data.id;
    assert.equal(created.body.data.steps[0].branch.question, 'Do you have it?');

    const publishedCatalog = await anonymousAgent(app).get(`/api/journeys/${id}`);
    assert.equal(publishedCatalog.status, 401);

    await admin.patch(`/api/admin/journeys/${id}/status`).send({ status: 'published' });
    const anonymousView = await anonymousAgent(app).get(`/api/journeys/${id}`);
    assert.equal(anonymousView.status, 401);
    const signedInView = await user.get(`/api/journeys/${id}`);
    assert.equal(signedInView.status, 200);

    const updated = await admin.put(`/api/admin/journeys/${id}`).send(validJourney({
      title: 'Updated Service Journey',
      verificationStatus: 'verified',
      lastVerified: '2026-01-15',
      sourceUrl: 'https://example.gov.in/source',
    }));
    assert.equal(updated.status, 200);
    assert.equal(updated.body.data.title, 'Updated Service Journey');
    assert.equal(updated.body.data.verificationStatus, 'verified');

    const archived = await admin.delete(`/api/admin/journeys/${id}`);
    assert.equal(archived.body.data.status, 'archived');
    assert.equal((await user.get(`/api/journeys/${id}`)).status, 404);

    const hard = await admin.delete(`/api/admin/journeys/${id}`);
    assert.equal(hard.body.data.deleted, true);
    assert.equal(findOfficialJourney(id), null);
  });

  it('rejects invalid journey payloads and missing ids', async () => {
    const invalid = await admin.post('/api/admin/journeys').send({ title: 'ab', steps: [] });
    assert.equal(invalid.status, 400);
    const missing = await admin.get('/api/admin/journeys/nope');
    assert.equal(missing.status, 404);
  });

  it('manages categories without allowing builtin deletion', async () => {
    const created = await admin.post('/api/admin/categories').send({ id: 'Legal', description: 'Legal processes' });
    assert.equal(created.status, 201);
    const updated = await admin.patch('/api/admin/categories/Legal').send({ description: 'Courts and documents' });
    assert.equal(updated.body.data.description, 'Courts and documents');
    const builtin = await admin.delete('/api/admin/categories/Government');
    assert.equal(builtin.status, 400);
    const removed = await admin.delete('/api/admin/categories/Legal');
    assert.equal(removed.body.data.deleted, true);
  });
});
