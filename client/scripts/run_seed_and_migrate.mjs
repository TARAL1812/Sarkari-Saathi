import path from 'node:path';
import { pathToFileURL } from 'node:url';

const backendSrc = 'C:/Design thinking  project/sarkari-saathi-backend-share/src';
const { migrate } = await import(pathToFileURL(path.join(backendSrc, 'db/migrate.js')).href);
const { seed } = await import(pathToFileURL(path.join(backendSrc, 'db/seed.js')).href);
const { getDb, closeDb } = await import(pathToFileURL(path.join(backendSrc, 'db/connection.js')).href);

console.log('Running migrate and seed on database...');
await seed();
console.log('Seeded successfully!');

const db = getDb();
const cats = db.prepare('SELECT COUNT(*) as c FROM categories').get();
const journeys = db.prepare('SELECT COUNT(*) as c FROM journeys').get();
const users = db.prepare('SELECT COUNT(*) as c FROM users').get();
console.log(`Summary: ${cats.c} categories, ${journeys.c} journeys, ${users.c} users`);
closeDb();
