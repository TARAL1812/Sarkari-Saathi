import assert from 'node:assert/strict';
import { afterEach, beforeEach, describe, it } from 'node:test';
import { closeDb } from '../src/db/connection.js';
import { findUserByEmail } from '../src/repositories/userRepository.js';
import { verifyPassword } from '../src/utils/passwords.js';
import { ORIGIN, PASSWORD, anonymousAgent, makeUser, setupApp, signedInAgent } from './helpers.js';

describe('authentication', () => {
  let app;

  beforeEach(() => {
    ({ app } = setupApp());
  });
  afterEach(() => closeDb());

  it('registers a user, hashes the password, and returns a session', async () => {
    const agent = anonymousAgent(app);
    const response = await agent.post('/api/auth/register').send({
      name: 'Citizen One',
      email: 'citizen@example.com',
      password: PASSWORD,
      role: 'admin',
    });
    assert.equal(response.status, 400);

    const ok = await agent.post('/api/auth/register').send({
      name: 'Citizen One',
      email: 'citizen@example.com',
      password: PASSWORD,
    });
    assert.equal(ok.status, 201);
    assert.equal(ok.body.data.user.role, 'user');
    assert.equal(ok.body.data.user.email, 'citizen@example.com');
    assert.ok(!ok.body.data.user.passwordHash);
    assert.ok(ok.headers['set-cookie']?.some((cookie) => cookie.startsWith('ss_session=')));

    const stored = findUserByEmail('citizen@example.com');
    assert.notEqual(stored.password_hash, PASSWORD);
    assert.equal(await verifyPassword(PASSWORD, stored.password_hash), true);
    assert.equal(stored.role, 'user');
  });

  it('rejects invalid credentials and duplicate emails', async () => {
    const agent = anonymousAgent(app);
    await agent.post('/api/auth/register').send({ name: 'Citizen', email: 'dup@example.com', password: PASSWORD });
    const dup = await agent.post('/api/auth/register').send({ name: 'Citizen', email: 'dup@example.com', password: PASSWORD });
    assert.equal(dup.status, 409);

    const bad = await agent.post('/api/auth/login').send({ email: 'dup@example.com', password: 'WrongPass1' });
    assert.equal(bad.status, 401);
    assert.equal(bad.body.error.code, 'INVALID_CREDENTIALS');

    const missing = await agent.post('/api/auth/login').send({ email: 'nobody@example.com', password: PASSWORD });
    assert.equal(missing.status, 401);
  });

  it('records only successful password logins', async () => {
    await makeUser({ email: 'login-count@example.com' });
    const user = findUserByEmail('login-count@example.com');
    assert.equal(user.login_count, 0);
    assert.equal(user.last_login_at, null);

    const agent = anonymousAgent(app);
    const failed = await agent.post('/api/auth/login').send({
      email: 'login-count@example.com',
      password: 'WrongPass1',
    });
    assert.equal(failed.status, 401);
    assert.equal(findUserByEmail('login-count@example.com').login_count, 0);

    const success = await agent.post('/api/auth/login').send({
      email: 'login-count@example.com',
      password: PASSWORD,
    });
    assert.equal(success.status, 200);
    const updated = findUserByEmail('login-count@example.com');
    assert.equal(updated.login_count, 1);
    assert.ok(updated.last_login_at);
  });

  it('exposes the current user only with a valid session', async () => {
    await makeUser({ email: 'me@example.com' });
    const agent = await signedInAgent(app, 'me@example.com');
    const me = await agent.get('/api/auth/me');
    assert.equal(me.status, 200);
    assert.equal(me.body.data.user.email, 'me@example.com');

    const anon = anonymousAgent(app);
    const denied = await anon.get('/api/auth/me');
    assert.equal(denied.status, 401);

    await agent.post('/api/auth/logout').send({});
    const after = await agent.get('/api/auth/me');
    assert.equal(after.status, 401);
  });

  it('changes password and invalidates previous sessions', async () => {
    await makeUser({ email: 'pw@example.com' });
    const agent = await signedInAgent(app, 'pw@example.com');
    const other = await signedInAgent(app, 'pw@example.com');

    const changed = await agent.post('/api/auth/change-password').send({
      currentPassword: PASSWORD,
      newPassword: 'NewSecret99',
    });
    assert.equal(changed.status, 200);

    const oldSession = await other.get('/api/auth/me');
    assert.equal(oldSession.status, 401);

    const loginOld = await anonymousAgent(app).post('/api/auth/login').send({ email: 'pw@example.com', password: PASSWORD });
    assert.equal(loginOld.status, 401);
    const loginNew = await anonymousAgent(app).post('/api/auth/login').send({ email: 'pw@example.com', password: 'NewSecret99' });
    assert.equal(loginNew.status, 200);
  });

  it('rejects cross-origin state-changing requests', async () => {
    const response = await anonymousAgent(app)
      .post('/api/auth/login')
      .set('Origin', 'https://evil.example')
      .send({ email: 'x@example.com', password: PASSWORD });
    assert.equal(response.status, 403);
    const allowed = ORIGIN;
    assert.ok(allowed);
  });
});
