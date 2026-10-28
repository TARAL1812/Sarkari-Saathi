import path from 'node:path';
import { pathToFileURL } from 'node:url';

const backendSrc = 'C:/Design thinking  project/sarkari-saathi-backend-share/src';
const supertestPath = 'C:/Design thinking  project/sarkari-saathi-backend-share/node_modules/supertest/index.js';

const { createApp } = await import(pathToFileURL(path.join(backendSrc, 'app.js')).href);
const { default: supertest } = await import(pathToFileURL(supertestPath).href);

const app = createApp({ authRateLimit: 1000 });
const request = supertest(app);

console.log('Testing backend endpoints:');

// 1. Health check
const health = await request.get('/api/health');
console.log('GET /api/health:', health.status, JSON.stringify(health.body));

// 2. Categories
const cats = await request.get('/api/categories');
console.log('GET /api/categories:', cats.status, `Returned ${cats.body.data?.categories?.length} categories`);

// 3. Journeys
const journeys = await request.get('/api/journeys');
console.log('GET /api/journeys:', journeys.status, `Returned ${journeys.body.data?.journeys?.length} journeys`);

// 4. Test Registration
const testEmail = `user_${Date.now()}@example.com`;
const regRes = await request
  .post('/api/auth/register')
  .set('Origin', 'http://localhost:5173')
  .send({
    name: 'Priya Sharma',
    email: testEmail,
    password: 'Password123!',
  });
console.log('POST /api/auth/register:', regRes.status, regRes.body.data?.user ? 'Success (User created)' : regRes.body);

// 5. Test Login
const loginRes = await request
  .post('/api/auth/login')
  .set('Origin', 'http://localhost:5173')
  .send({
    email: testEmail,
    password: 'Password123!',
  });
console.log('POST /api/auth/login:', loginRes.status, loginRes.body.data?.user?.email);
const cookie = loginRes.headers['set-cookie'];

// 6. Test GET /api/auth/me with session cookie
const meRes = await request
  .get('/api/auth/me')
  .set('Origin', 'http://localhost:5173')
  .set('Cookie', cookie);
console.log('GET /api/auth/me:', meRes.status, meRes.body.data?.user?.name);

// 7. Test Admin Login (seeded demo admin)
const adminLogin = await request
  .post('/api/auth/login')
  .set('Origin', 'http://localhost:5173')
  .send({
    email: 'admin@example.com',
    password: 'ChangeMe_admin1',
  });
console.log('POST /api/auth/login (admin):', adminLogin.status, 'Role:', adminLogin.body.data?.user?.role);
const adminCookie = adminLogin.headers['set-cookie'];

// 8. Test Admin Category List & Create
const adminCats = await request
  .get('/api/admin/categories')
  .set('Origin', 'http://localhost:5173')
  .set('Cookie', adminCookie);
console.log('GET /api/admin/categories:', adminCats.status, `Returned ${adminCats.body.data?.categories?.length} admin categories`);

// 9. Test User Journey creation
const createJourney = await request
  .post('/api/me/journeys')
  .set('Origin', 'http://localhost:5173')
  .set('Cookie', cookie)
  .send({
    title: 'My Driving Licence Journey',
    category: 'Transport',
    country: 'India',
    description: 'Personal plan for learner license renewal',
    steps: [
      { title: 'Fill form online', requiredDocuments: ['Aadhaar', 'Photo'] },
      { title: 'Visit RTO for biometric', requiredDocuments: ['Slot slip'] }
    ]
  });
console.log('POST /api/me/journeys:', createJourney.status, createJourney.body.data?.journey?.id ? 'Success (Created)' : createJourney.body);
const userJourneyId = createJourney.body.data?.journey?.id;

// 10. Test Checklist update
if (userJourneyId) {
  const checkRes = await request
    .patch(`/api/me/journeys/${userJourneyId}/checklist`)
    .set('Origin', 'http://localhost:5173')
    .set('Cookie', cookie)
    .send({
      checked: true,
      documentName: 'Aadhaar'
    });
  console.log('PATCH checklist:', checkRes.status, checkRes.body.data?.checklist);

  const progRes = await request
    .patch(`/api/me/journeys/${userJourneyId}/progress`)
    .set('Origin', 'http://localhost:5173')
    .set('Cookie', cookie)
    .send({
      stepId: createJourney.body.data?.journey?.steps?.[0]?.id,
      completed: true
    });
  console.log('PATCH progress:', progRes.status, 'Progress:', progRes.body.data?.progress);
}

// 11. Test Form Validation (Invalid Registration)
const badReg = await request
  .post('/api/auth/register')
  .set('Origin', 'http://localhost:5173')
  .send({
    name: '',
    email: 'invalid-email',
    password: '123', // too short
  });
console.log('Validation test (bad registration expected 400):', badReg.status, badReg.body.error?.code);

console.log('All backend integration tests completed!');
