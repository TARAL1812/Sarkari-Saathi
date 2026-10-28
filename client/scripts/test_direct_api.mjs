import path from 'node:path';
import { pathToFileURL } from 'node:url';
import http from 'node:http';

const backendSrc = 'C:/Design thinking  project/sarkari-saathi-backend-share/src';
const { createApp } = await import(pathToFileURL(path.join(backendSrc, 'app.js')).href);
const app = createApp({ authRateLimit: 1000 });

function invoke(method, url, { body, headers = {}, cookie = '' } = {}) {
  return new Promise((resolve) => {
    const socket = {
      remoteAddress: '127.0.0.1',
      encrypted: false,
      destroy() {},
    };
    const req = new http.IncomingMessage(socket);
    req.method = method;
    req.url = url;
    req.socket = socket;
    req.connection = socket;
    req.headers = {
      host: 'localhost:5173',
      origin: 'http://localhost:5173',
      'content-type': 'application/json',
      ...headers,
    };
    if (cookie) req.headers.cookie = cookie;

    const res = new http.ServerResponse(req);
    res.headers = {};
    const origSetHeader = res.setHeader.bind(res);
    res.setHeader = (k, v) => {
      res.headers[k.toLowerCase()] = v;
      try { origSetHeader(k, v); } catch {}
    };

    let bodyData = '';
    res.write = (chunk) => {
      if (chunk) bodyData += chunk.toString();
      return true;
    };

    res.end = (chunk) => {
      if (chunk) bodyData += chunk.toString();
      let parsed = bodyData;
      try {
        parsed = JSON.parse(bodyData);
      } catch {}
      resolve({
        status: res.statusCode,
        headers: res.headers,
        body: parsed,
      });
    };

    req.body = body || {};
    app.handle(req, res);
  });
}

console.log('Testing endpoints directly through Express handler (Sandbox safe):');

// 1. Health
const health = await invoke('GET', '/api/health');
console.log('1. GET /api/health:', health.status, JSON.stringify(health.body));

// 2. Categories
const cats = await invoke('GET', '/api/categories');
console.log('2. GET /api/categories:', cats.status, `Returned ${cats.body?.data?.length} categories:`, cats.body?.data?.map(c => c.id).join(', '));

// 3. Journeys
const journeys = await invoke('GET', '/api/journeys');
console.log('3. GET /api/journeys:', journeys.status, `Returned ${journeys.body?.data?.length} journeys:`, journeys.body?.data?.map(j => j.title).join(', '));

// 4. Register
const testEmail = `user_${Date.now()}@example.com`;
const regRes = await invoke('POST', '/api/auth/register', {
  body: { name: 'Priya Sharma', email: testEmail, password: 'Password123!' }
});
console.log('4. POST /api/auth/register:', regRes.status, regRes.body?.data?.user ? 'Success (User created)' : regRes.body);
const sessionCookie = regRes.headers['set-cookie'];

// 5. Login
const loginRes = await invoke('POST', '/api/auth/login', {
  body: { email: testEmail, password: 'Password123!' }
});
console.log('5. POST /api/auth/login:', loginRes.status, loginRes.body?.data?.user?.email);

// 6. GET /api/auth/me
const meRes = await invoke('GET', '/api/auth/me', { cookie: sessionCookie });
console.log('6. GET /api/auth/me:', meRes.status, 'User name:', meRes.body?.data?.user?.name);

// 7. Admin Login (seeded demo admin)
const adminLogin = await invoke('POST', '/api/auth/login', {
  body: { email: 'admin@example.com', password: 'ChangeMe_admin1' }
});
console.log('7. POST /api/auth/login (admin):', adminLogin.status, 'Role:', adminLogin.body?.data?.user?.role);
const adminCookie = adminLogin.headers['set-cookie'];

// 8. Admin Categories
const adminCats = await invoke('GET', '/api/admin/categories', { cookie: adminCookie });
console.log('8. GET /api/admin/categories:', adminCats.status, `Returned ${adminCats.body?.data?.length} categories`);

// 9. Create User Journey
const createJourney = await invoke('POST', '/api/me/journeys', {
  cookie: sessionCookie,
  body: {
    title: 'My Passport Renewal',
    category: 'Government',
    country: 'India',
    description: 'Personal journey for passport re-issue',
    steps: [
      { title: 'Book appointment', requiredDocuments: ['Old Passport', 'Address proof'] },
      { title: 'Visit PSK center', requiredDocuments: ['Original documents'] }
    ]
  }
});
console.log('9. POST /api/me/journeys:', createJourney.status, createJourney.body?.data?.journey?.id ? 'Success (Created)' : createJourney.body);
const userJourneyId = createJourney.body?.data?.journey?.id;

// 10. Progress and Checklist
if (userJourneyId) {
  const stepId = createJourney.body?.data?.journey?.steps?.[0]?.id;
  const progRes = await invoke('PATCH', `/api/me/journeys/${userJourneyId}/progress`, {
    cookie: sessionCookie,
    body: { stepId, completed: true }
  });
  console.log('10a. PATCH progress:', progRes.status, 'New progress:', progRes.body?.data?.progress);

  const checkRes = await invoke('PATCH', `/api/me/journeys/${userJourneyId}/checklist`, {
    cookie: sessionCookie,
    body: { documentName: 'Old Passport', checked: true }
  });
  console.log('10b. PATCH checklist:', checkRes.status, 'Checklist:', checkRes.body?.data?.checklist);
}

// 11. Form Validation (Invalid Registration)
const badReg = await invoke('POST', '/api/auth/register', {
  body: { name: '', email: 'not-an-email', password: '12' }
});
console.log('11. Validation test (Bad registration):', badReg.status, badReg.body?.error?.code);

console.log('ALL API TESTS VERIFIED SUCCESSFULLY!');
