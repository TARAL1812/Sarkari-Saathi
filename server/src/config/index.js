import dotenv from 'dotenv';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, '../..');

dotenv.config({ path: path.join(projectRoot, '.env') });

const nodeEnv = process.env.NODE_ENV || 'development';

export const config = {
  port: Number(process.env.PORT) || 3001,
  nodeEnv,
  projectRoot,
  databasePath: path.resolve(projectRoot, process.env.DATABASE_PATH || './data/sarkari-saathi.db'),
  frontendOrigins: (process.env.FRONTEND_ORIGIN || 'http://localhost:5173')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean),
  sessionCookieName: 'ss_session',
  sessionTtlDays: Number(process.env.SESSION_TTL_DAYS) || 7,
  secureCookies: process.env.COOKIE_SECURE
    ? process.env.COOKIE_SECURE === 'true'
    : nodeEnv === 'production',
  authRateLimit: Number(process.env.AUTH_RATE_LIMIT) || 20,
  trustProxy: process.env.TRUST_PROXY || '',
  seedAdmin: {
    email: process.env.SEED_ADMIN_EMAIL || '',
    password: process.env.SEED_ADMIN_PASSWORD || '',
    name: process.env.SEED_ADMIN_NAME || 'Administrator',
  },
};
