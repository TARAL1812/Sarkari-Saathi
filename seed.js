import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { config } from '../config/index.js';
import { hashPassword } from '../utils/passwords.js';
import { nowIso } from '../utils/ids.js';
import { getDb } from './connection.js';
import { migrate } from './migrate.js';
import { SEED_CATEGORIES, SEED_JOURNEYS } from './seedData.js';
import { replaceOfficialSteps } from '../repositories/journeyRepository.js';

export function seedCatalog(database = getDb()) {
  const now = nowIso();
  const insertCategory = database.prepare(`
    INSERT INTO categories (id, description, is_builtin, created_at, updated_at)
    VALUES (@id, @description, @is_builtin, @created_at, @updated_at)
    ON CONFLICT(id) DO NOTHING
  `);

  const insertJourney = database.prepare(`
    INSERT INTO journeys (
      id, title, category, country, region, description, target_user,
      organization_name, department, official_website, source_url,
      verification_status, last_verified, location, is_demo, status,
      archived_at, created_at, updated_at, created_by
    ) VALUES (
      @id, @title, @category, @country, @region, @description, @target_user,
      @organization_name, @department, @official_website, @source_url,
      @verification_status, @last_verified, @location, @is_demo, @status,
      NULL, @created_at, @updated_at, @created_by
    )
    ON CONFLICT(id) DO NOTHING
  `);

  const run = database.transaction(() => {
    for (const category of SEED_CATEGORIES) {
      insertCategory.run({
        id: category.id,
        description: category.description,
        is_builtin: category.is_builtin,
        created_at: now,
        updated_at: now,
      });
    }

    for (const journey of SEED_JOURNEYS) {
      const result = insertJourney.run({
        id: journey.id,
        title: journey.title,
        category: journey.category,
        country: journey.country,
        region: journey.region,
        description: journey.description,
        target_user: journey.targetUser,
        organization_name: journey.organizationName,
        department: journey.department,
        official_website: journey.officialWebsite,
        source_url: journey.sourceUrl,
        verification_status: journey.verificationStatus,
        last_verified: journey.lastVerified,
        location: journey.location,
        is_demo: journey.isDemo ? 1 : 0,
        status: journey.status,
        created_at: now,
        updated_at: now,
        created_by: journey.createdBy,
      });
      if (result.changes > 0) {
        replaceOfficialSteps(database, journey.id, journey.steps);
      }
    }
  });

  run();
}

export async function seedOptionalAdmin(database = getDb()) {
  const email = config.seedAdmin.email.trim();
  const password = config.seedAdmin.password;
  if (!email || !password) return null;
  const existing = database.prepare('SELECT id FROM users WHERE email = ? COLLATE NOCASE').get(email);
  if (existing) return existing.id;
  const now = nowIso();
  const id = 'seed-admin';
  database.prepare(`
    INSERT INTO users (id, name, email, password_hash, role, created_at, updated_at)
    VALUES (?, ?, ?, ?, 'admin', ?, ?)
  `).run(id, config.seedAdmin.name, email.toLowerCase(), await hashPassword(password), now, now);
  return id;
}

export async function seed(database = getDb()) {
  migrate(database);
  seedCatalog(database);
  await seedOptionalAdmin(database);
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  await seed();
  console.log('Demo catalog seeded (existing rows were left unchanged).');
}
