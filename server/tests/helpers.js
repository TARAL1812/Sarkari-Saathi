process.env.NODE_ENV = 'test';
process.env.FRONTEND_ORIGIN = 'http://localhost:5173';

import request from 'supertest';
import { createApp } from '../src/app.js';
import { openMemoryDb } from '../src/db/connection.js';
import { seedCatalog } from '../src/db/seed.js';
import { migrate } from '../src/db/migrate.js';
import { hashPassword } from '../src/utils/passwords.js';
import { createUser } from '../src/repositories/userRepository.js';

export const ORIGIN = 'http://localhost:5173';
export const PASSWORD = 'Sup3rSecret1';

export function setupApp() {
  const db = openMemoryDb();
  migrate(db);
  seedCatalog(db);
  return { db, app: createApp({ authRateLimit: 1000 }) };
}

export async function makeUser({ name = 'Test Person', email, role = 'user', password = PASSWORD }) {
  return createUser({ name, email, passwordHash: await hashPassword(password), role });
}

export async function signedInAgent(app, email, password = PASSWORD) {
  const agent = request.agent(app);
  agent.set('Origin', ORIGIN);
  const response = await agent.post('/api/auth/login').send({ email, password });
  if (response.status !== 200) throw new Error(`login failed for ${email}: ${response.status} ${JSON.stringify(response.body)}`);
  return agent;
}

export function anonymousAgent(app) {
  const agent = request.agent(app);
  agent.set('Origin', ORIGIN);
  return agent;
}

export const validJourney = (overrides = {}) => ({
  title: 'Example Service Journey',
  category: 'Government',
  country: 'India',
  description: 'Test journey for automated tests.',
  verificationStatus: 'unverified',
  steps: [
    {
      title: 'First step',
      description: 'Do the first thing.',
      requiredDocuments: ['Document A', 'Document B'],
      commonProblems: ['Problem A'],
      branch: { question: 'Do you have it?', yes: 'Continue', no: 'Get it first' },
    },
    { title: 'Second step', requiredDocuments: ['Document C'] },
  ],
  ...overrides,
});
