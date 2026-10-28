import { DatabaseSync } from 'node:sqlite';
const db = new DatabaseSync('c:/Design thinking  project/sarkari-saathi-backend-share/data/sarkari-saathi.db');
const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all();
console.log('Tables:', tables.map(t => t.name));
const cats = db.prepare('SELECT COUNT(*) as c FROM categories').get();
console.log('Categories count:', cats.c);
const journeys = db.prepare('SELECT COUNT(*) as c FROM journeys').get();
console.log('Journeys count:', journeys.c);
db.close();
