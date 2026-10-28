import { DatabaseSync } from 'node:sqlite';

const db = new DatabaseSync('C:/Design thinking  project/JourneyMapComplete/data/sarkari-saathi.db');
const sql = "SELECT * FROM journeys WHERE status = @status";
const stmt = db.prepare(sql);
console.log('Testing with { status: "published" }');
try {
  const rows = stmt.all({ status: 'published' });
  console.log('Rows count:', rows.length);
} catch (e) {
  console.log('Error with plain key:', e.message);
}

try {
  const rows = stmt.all({ '@status': 'published' });
  console.log('Rows with @status count:', rows.length);
} catch (e) {
  console.log('Error with @ key:', e.message);
}
db.close();
