PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE COLLATE NOCASE,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin')),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS sessions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  created_at TEXT NOT NULL,
  expires_at TEXT NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_expires ON sessions(expires_at);

CREATE TABLE IF NOT EXISTS categories (
  id TEXT PRIMARY KEY,
  description TEXT NOT NULL DEFAULT '',
  is_builtin INTEGER NOT NULL DEFAULT 0 CHECK (is_builtin IN (0, 1)),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS journeys (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  category TEXT NOT NULL,
  country TEXT,
  region TEXT,
  description TEXT,
  target_user TEXT,
  organization_name TEXT,
  department TEXT,
  official_website TEXT,
  source_url TEXT,
  verification_status TEXT NOT NULL DEFAULT 'unverified'
    CHECK (verification_status IN ('demo', 'unverified', 'pending', 'verified')),
  last_verified TEXT,
  location TEXT,
  is_demo INTEGER NOT NULL DEFAULT 0 CHECK (is_demo IN (0, 1)),
  status TEXT NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft', 'published', 'archived')),
  archived_at TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  created_by TEXT NOT NULL DEFAULT 'system',
  FOREIGN KEY (category) REFERENCES categories(id)
);

CREATE INDEX IF NOT EXISTS idx_journeys_status ON journeys(status);
CREATE INDEX IF NOT EXISTS idx_journeys_category ON journeys(category);
CREATE INDEX IF NOT EXISTS idx_journeys_updated ON journeys(updated_at);

CREATE TABLE IF NOT EXISTS journey_steps (
  id TEXT PRIMARY KEY,
  journey_id TEXT NOT NULL,
  step_number INTEGER NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  location TEXT,
  responsible_organization TEXT,
  estimated_time TEXT,
  possible_fee TEXT,
  what_happens_next TEXT,
  official_source TEXT,
  UNIQUE (journey_id, step_number),
  FOREIGN KEY (journey_id) REFERENCES journeys(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_journey_steps_journey ON journey_steps(journey_id);

CREATE TABLE IF NOT EXISTS step_documents (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  step_id TEXT NOT NULL,
  name TEXT NOT NULL,
  position INTEGER NOT NULL,
  FOREIGN KEY (step_id) REFERENCES journey_steps(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS step_problems (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  step_id TEXT NOT NULL,
  text TEXT NOT NULL,
  position INTEGER NOT NULL,
  FOREIGN KEY (step_id) REFERENCES journey_steps(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS step_branches (
  step_id TEXT PRIMARY KEY,
  question TEXT NOT NULL,
  yes_path TEXT,
  no_path TEXT,
  FOREIGN KEY (step_id) REFERENCES journey_steps(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS content_verifications (
  id TEXT PRIMARY KEY,
  journey_id TEXT NOT NULL,
  verified_by TEXT,
  verification_status TEXT NOT NULL,
  source_url TEXT,
  notes TEXT,
  verified_at TEXT NOT NULL,
  FOREIGN KEY (journey_id) REFERENCES journeys(id) ON DELETE CASCADE,
  FOREIGN KEY (verified_by) REFERENCES users(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_verifications_journey ON content_verifications(journey_id);

CREATE TABLE IF NOT EXISTS user_journeys (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  source_journey_id TEXT,
  title TEXT NOT NULL,
  category TEXT NOT NULL,
  country TEXT,
  region TEXT,
  description TEXT,
  target_user TEXT,
  organization_name TEXT,
  department TEXT,
  official_website TEXT,
  source_url TEXT,
  location TEXT,
  progress INTEGER NOT NULL DEFAULT 0 CHECK (progress BETWEEN 0 AND 100),
  archived_at TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (source_journey_id) REFERENCES journeys(id) ON DELETE SET NULL,
  FOREIGN KEY (category) REFERENCES categories(id)
);

CREATE INDEX IF NOT EXISTS idx_user_journeys_user ON user_journeys(user_id, updated_at);
CREATE INDEX IF NOT EXISTS idx_user_journeys_source ON user_journeys(source_journey_id);

CREATE TABLE IF NOT EXISTS user_journey_steps (
  id TEXT PRIMARY KEY,
  user_journey_id TEXT NOT NULL,
  step_number INTEGER NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  location TEXT,
  responsible_organization TEXT,
  estimated_time TEXT,
  possible_fee TEXT,
  what_happens_next TEXT,
  official_source TEXT,
  UNIQUE (user_journey_id, step_number),
  FOREIGN KEY (user_journey_id) REFERENCES user_journeys(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_user_steps_journey ON user_journey_steps(user_journey_id);

CREATE TABLE IF NOT EXISTS user_step_documents (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  step_id TEXT NOT NULL,
  name TEXT NOT NULL,
  position INTEGER NOT NULL,
  FOREIGN KEY (step_id) REFERENCES user_journey_steps(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS user_step_problems (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  step_id TEXT NOT NULL,
  text TEXT NOT NULL,
  position INTEGER NOT NULL,
  FOREIGN KEY (step_id) REFERENCES user_journey_steps(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS user_step_branches (
  step_id TEXT PRIMARY KEY,
  question TEXT NOT NULL,
  yes_path TEXT,
  no_path TEXT,
  FOREIGN KEY (step_id) REFERENCES user_journey_steps(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS user_completed_steps (
  user_journey_id TEXT NOT NULL,
  step_id TEXT NOT NULL,
  completed_at TEXT NOT NULL,
  PRIMARY KEY (user_journey_id, step_id),
  FOREIGN KEY (user_journey_id) REFERENCES user_journeys(id) ON DELETE CASCADE,
  FOREIGN KEY (step_id) REFERENCES user_journey_steps(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS user_checklist_items (
  user_journey_id TEXT NOT NULL,
  document_name TEXT NOT NULL,
  completed INTEGER NOT NULL DEFAULT 0 CHECK (completed IN (0, 1)),
  updated_at TEXT NOT NULL,
  PRIMARY KEY (user_journey_id, document_name),
  FOREIGN KEY (user_journey_id) REFERENCES user_journeys(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS journey_requests (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT,
  related_journey_id TEXT,
  status TEXT NOT NULL DEFAULT 'submitted'
    CHECK (status IN ('submitted', 'under_review', 'accepted', 'rejected', 'closed')),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (category) REFERENCES categories(id),
  FOREIGN KEY (related_journey_id) REFERENCES journeys(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_requests_user ON journey_requests(user_id, updated_at);
CREATE INDEX IF NOT EXISTS idx_requests_status ON journey_requests(status);

CREATE TABLE IF NOT EXISTS journey_request_history (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  request_id TEXT NOT NULL,
  from_status TEXT,
  to_status TEXT NOT NULL,
  actor_id TEXT,
  note TEXT,
  created_at TEXT NOT NULL,
  FOREIGN KEY (request_id) REFERENCES journey_requests(id) ON DELETE CASCADE,
  FOREIGN KEY (actor_id) REFERENCES users(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_request_history_request ON journey_request_history(request_id);

CREATE TABLE IF NOT EXISTS user_abroad_settings (
  user_id TEXT PRIMARY KEY,
  mode INTEGER NOT NULL DEFAULT 0 CHECK (mode IN (0, 1)),
  updated_at TEXT NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS user_abroad_tasks (
  user_id TEXT NOT NULL,
  task_id TEXT NOT NULL,
  title TEXT NOT NULL,
  progress INTEGER NOT NULL DEFAULT 0 CHECK (progress BETWEEN 0 AND 100),
  PRIMARY KEY (user_id, task_id),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
